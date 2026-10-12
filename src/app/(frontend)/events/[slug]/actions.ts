'use server'

import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'

import { normaliseKenyanPhone } from '@/lib/phone'
import { clientIp } from '@/lib/forms/guard'
import { createRsvp, hashIp, isRateLimited } from '@/lib/rsvp'

export type RsvpFields = 'name' | 'contact' | 'organization' | 'attendees' | 'consent'

export type RsvpState = {
  status: 'idle' | 'ok' | 'error' | 'full' | 'closed'
  message?: string
  errors?: Partial<Record<RsvpFields, string>>
  values?: { name: string; email: string; phone: string; organization: string; attendees: string }
  remaining?: number | null
}

const MAX_PER_BOOKING = 10

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter your name.')
    .max(100, 'Keep your name under 100 characters.'),
  email: z.string().trim().max(200).email('Enter a valid email address.').or(z.literal('')),
  phone: z.string().trim().max(30),
  organization: z.string().trim().max(120, 'Keep this under 120 characters.'),
  attendees: z.coerce
    .number({ error: 'Enter how many people are coming.' })
    .int('Enter a whole number.')
    .min(1, 'At least 1 person.')
    .max(MAX_PER_BOOKING, `For more than ${MAX_PER_BOOKING} people, please contact us.`),
  consent: z.literal('on', { error: 'Please agree so we can keep your details.' }),
})

/**
 * Contact rule: an email or a phone number, and a phone must be a Kenyan mobile. It runs beside the
 * field checks (not inside them) so every problem is reported together.
 */
function contactError(email: string, phone: string): string | undefined {
  if (!email.trim() && !phone.trim()) return 'Give an email address or a phone number.'
  if (phone.trim() && !normaliseKenyanPhone(phone)) {
    return 'Enter a Kenyan mobile number such as 0712 345 678.'
  }
  return undefined
}

const text = (formData: FormData, key: string): string => {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

/**
 * Registers someone for an event (FR-EVT-05). Closed events, full events and visitors sending too
 * many forms are turned away on the server, whatever the page showed when it was loaded.
 */
export async function submitRsvp(
  slug: string,
  _previous: RsvpState,
  formData: FormData,
): Promise<RsvpState> {
  const values = {
    name: text(formData, 'name'),
    email: text(formData, 'email'),
    phone: text(formData, 'phone'),
    organization: text(formData, 'organization'),
    attendees: text(formData, 'attendees'),
  }

  // Honeypot: a field people never see. Bots fill it in, and get a convincing success.
  if (text(formData, 'website') !== '') {
    return { status: 'ok', message: 'Thank you. You are registered.' }
  }

  const parsed = schema.safeParse({ ...values, consent: text(formData, 'consent') })
  const errors: NonNullable<RsvpState['errors']> = {}
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]) as RsvpFields
      errors[key] ??= issue.message
    }
  }
  const contact = contactError(values.email, values.phone)
  if (contact) errors.contact = contact
  if (!parsed.success || contact) {
    return { status: 'error', errors, values, message: 'Please check the highlighted fields.' }
  }
  const input = parsed.data

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const event = docs[0]
  if (!event) return { status: 'closed', message: 'This event could not be found.' }
  if (event.status === 'cancelled') {
    return { status: 'closed', message: 'This event has been cancelled.' }
  }
  if (new Date(event.endsAt).getTime() < Date.now()) {
    return { status: 'closed', message: 'This event has finished, so registration is closed.' }
  }
  if (!event.rsvpEnabled) {
    return { status: 'closed', message: 'Registration is not open for this event.' }
  }

  const ipHash = hashIp(clientIp(await headers()))
  if (await isRateLimited(ipHash)) {
    return {
      status: 'error',
      values,
      message:
        'Too many submissions from your connection. Please wait a few minutes and try again.',
    }
  }

  const result = await createRsvp(
    {
      eventId: event.id,
      name: input.name,
      email: input.email || null,
      phone: input.phone ? normaliseKenyanPhone(input.phone) : null,
      organization: input.organization || null,
      attendees: input.attendees,
    },
    event.capacity ?? null,
    ipHash,
  )

  revalidatePath(`/events/${slug}`)

  if (!result.ok) {
    return {
      status: 'full',
      values,
      remaining: result.remaining,
      message:
        result.remaining === 0
          ? 'Registration is full. Thank you for your interest.'
          : `Only ${result.remaining} ${result.remaining === 1 ? 'place is' : 'places are'} left. Please lower the number of people.`,
    }
  }

  return {
    status: 'ok',
    remaining: result.remaining,
    message: `Thank you, ${input.name}. You are registered for ${input.attendees} ${input.attendees === 1 ? 'place' : 'places'}.`,
  }
}
