import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import { clientIp, hashIp, isRateLimited } from '@/lib/forms/guard'
import { contactInbox, sendMail, type MailResult } from '@/lib/forms/mail'
import { subscribe } from '@/lib/forms/newsletter'
import { FORM_TYPES, fieldErrors, formSchemas, type FormType } from '@/lib/forms/schemas'
import { acknowledgementEmail, notificationEmail } from '@/lib/forms/templates'
import { verifyTurnstile } from '@/lib/forms/turnstile'
import { normaliseKenyanPhone } from '@/lib/phone'

export type SubmitResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

const SUCCESS: Record<FormType, string> = {
  contact: 'Thank you. Your message has been sent. We will reply as soon as we can.',
  volunteer: 'Thank you for offering your time. We will be in touch about how you can help.',
  partnership:
    'Thank you. We have your enquiry and will be in touch to talk about working together.',
  'school-visit': 'Thank you. We have your request and will contact you to agree a date.',
  join: 'Thank you. We have your request. The committee will review it and contact you.',
  pledge: 'Thank you for your pledge. We will contact you with the details for giving.',
  newsletter:
    'Thank you. If this address needs confirming, we have just emailed you a link to confirm it.',
}

const TURNSTILE_MESSAGES = {
  missing: 'Please complete the human check and try again.',
  rejected: 'We could not confirm you are human. Please try again.',
  unavailable: 'The human check could not be completed. Please try again in a moment.',
  'not-configured': 'This form is not available right now. Please email us instead.',
} as const

type Values = Record<string, unknown>

/** Phone numbers are saved in the 2547XXXXXXXX form. Fields the visitor left empty are dropped. */
function cleanValues(parsed: Values): Values {
  const { consent: _consent, website: _website, turnstileToken: _token, ...rest } = parsed
  const out: Values = {}
  for (const [key, value] of Object.entries(rest)) {
    if (value === '' || value === undefined || value === null) continue
    out[key] =
      key === 'phone' && typeof value === 'string' ? (normaliseKenyanPhone(value) ?? value) : value
  }
  return out
}

/**
 * The one path every public form goes through (FR-FRM-01 to 05):
 *
 * 1. a filled honeypot gets a quiet "success" and nothing is saved;
 * 2. the input is validated with the same zod schema the browser used;
 * 3. Cloudflare Turnstile is verified on the server;
 * 4. a connection that has already saved 5 submissions in 10 minutes is turned away;
 * 5. the submission is saved, then emailed to the inbox and acknowledged to the sender.
 *
 * Saving comes before email, so an SMTP problem can never lose a message.
 */
export async function processSubmission(
  formType: FormType,
  raw: unknown,
  headers: Headers,
): Promise<SubmitResult> {
  if (!FORM_TYPES.includes(formType)) return { ok: false, message: 'Unknown form.' }

  const honeypot = (raw as { website?: unknown } | null)?.website
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return { ok: true, message: SUCCESS[formType] }
  }

  const parsed = formSchemas[formType].safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please check the highlighted fields.',
      fieldErrors: fieldErrors(parsed.error),
    }
  }
  const data = parsed.data as Values

  const ip = clientIp(headers)
  const human = await verifyTurnstile(String(data.turnstileToken ?? ''), ip)
  if (!human.ok) return { ok: false, message: TURNSTILE_MESSAGES[human.reason] }

  const ipHash = hashIp(ip)
  if (await isRateLimited(ipHash)) {
    return {
      ok: false,
      message:
        'Too many submissions from your connection. Please wait a few minutes and try again.',
    }
  }

  const values = cleanValues(data)
  const payload = await getPayload({ config })
  const saved = await payload.create({
    collection: 'form-submissions',
    data: { formType, data: values, consent: true, ipHash, emailStatus: 'pending' },
    overrideAccess: true,
    context: { skipAudit: true },
  })

  if (formType === 'newsletter') {
    // The double opt-in email is the only email; the inbox is not told about signups.
    await subscribe(String(values.email))
    await payload.update({
      collection: 'form-submissions',
      id: saved.id,
      data: { emailStatus: 'sent' },
      overrideAccess: true,
      context: { skipAudit: true },
    })
    return { ok: true, message: SUCCESS.newsletter }
  }

  if (formType === 'pledge') await recordPledge(values)

  const notification = notificationEmail(formType, values)
  const replyTo = typeof values.email === 'string' ? values.email : undefined
  const notified = await sendMail({ to: contactInbox(), replyTo, ...notification })

  let acknowledged: MailResult = 'skipped'
  if (replyTo) {
    const name = String(values.name ?? values.contactPerson ?? '')
    acknowledged = await sendMail({
      to: replyTo,
      ...acknowledgementEmail(formType, name, values),
    })
  }
  if (acknowledged === 'failed')
    console.error(`Acknowledgement to the sender failed for submission ${saved.id}`)

  await payload.update({
    collection: 'form-submissions',
    id: saved.id,
    data: { emailStatus: notified },
    overrideAccess: true,
    context: { skipAudit: true },
  })

  return { ok: true, message: SUCCESS[formType] }
}

/** FR-DON-02: a pledge is also recorded in donations, with status "pledged". */
async function recordPledge(values: Values): Promise<void> {
  const payload = await getPayload({ config })
  let program: number | undefined
  if (typeof values.program === 'string') {
    const found = await payload.find({
      collection: 'programs',
      where: { slug: { equals: values.program } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    program = found.docs[0]?.id
  }
  await payload.create({
    collection: 'donations',
    data: {
      name: typeof values.name === 'string' ? values.name : undefined,
      phone: String(values.phone),
      amount: Number(values.amount),
      program,
      channel: 'pledge',
      status: 'pledged',
    },
    overrideAccess: true,
    context: { skipAudit: true },
  })
}
