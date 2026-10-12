import { FORM_LABELS, type FormType } from '@/lib/forms/schemas'
import { siteUrl } from '@/lib/event-time'

/** Brand colours from enkaji-content/brand/brand.md, written out because email clients ignore CSS variables. */
const C = {
  green: '#1C380E',
  gold: '#C4A050',
  deepGold: '#7A5C22',
  bead: '#EEE3C4',
  sand: '#F7F1E1',
  ink: '#1C1A17',
} as const

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export type EmailContent = { subject: string; text: string; html: string }

type Layout = {
  title: string
  preheader: string
  /** Paragraphs and blocks as ready-made HTML. Escape any user text before passing it in. */
  body: string
  button?: { label: string; href: string }
  footerNote?: string
}

/** One branded layout for every email: green header with the logo, white card on sand, small footer. */
function layout({ title, preheader, body, button, footerNote }: Layout): string {
  const site = siteUrl()
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${C.sand};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:${C.green};padding:20px 24px;border-radius:12px 12px 0 0;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:12px;"><img src="cid:logo-mark" width="48" height="48" alt="" style="display:block;border:0;"></td>
<td style="font-family:Georgia,'Times New Roman',serif;font-size:16px;letter-spacing:2px;color:${C.sand};text-transform:uppercase;font-weight:bold;">Enkaji Enkitati CBO</td>
</tr></table></td></tr>
<tr><td style="height:4px;background:${C.gold};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="background:#ffffff;padding:28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:${C.ink};">
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;color:${C.green};">${escapeHtml(title)}</h1>
${body}
${
  button
    ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(button.href)}" style="display:inline-block;background:${C.gold};color:${C.green};font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:8px;">${escapeHtml(button.label)}</a></p>`
    : ''
}
</td></tr>
<tr><td style="background:${C.bead};padding:16px 24px;border-radius:0 0 12px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${C.ink};">
${footerNote ? `<p style="margin:0 0 8px;">${footerNote}</p>` : ''}
<p style="margin:0;">Enkaji Enkitati CBO, Narok, Kenya. Empowering Women, Sustaining Futures.<br>
<a href="mailto:info@enkajienkitaticbo.org" style="color:${C.deepGold};">info@enkajienkitaticbo.org</a> &middot;
<a href="${site}/privacy" style="color:${C.deepGold};">Privacy notice</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`
}

const p = (html: string): string => `<p style="margin:0 0 14px;">${html}</p>`

/** Human labels for the fields in each form, in the order they are listed in the inbox email. */
const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  schoolName: 'School',
  contactPerson: 'Contact person',
  role: 'Role',
  organization: 'Organization',
  email: 'Email',
  phone: 'Phone',
  area: 'Village or ward',
  level: 'School level',
  preferredDates: 'Preferred dates',
  interest: 'Interested in',
  interests: 'Would like to help with',
  availability: 'Availability',
  amount: 'Pledge amount (KES)',
  program: 'Program',
  channel: 'Preferred way to give',
  message: 'Message',
}

export type FieldRow = { label: string; value: string }

/** The submitted values as label and text rows, skipping empty ones. */
export function fieldRows(values: Record<string, unknown>): FieldRow[] {
  return Object.keys(FIELD_LABELS).flatMap((key) => {
    const raw = values[key]
    const value = Array.isArray(raw)
      ? raw.join(', ')
      : raw === undefined || raw === null
        ? ''
        : String(raw)
    return value.trim() ? [{ label: FIELD_LABELS[key], value }] : []
  })
}

/** Email to the CBO's inbox: everything the person sent, with replies going straight to them. */
export function notificationEmail(
  formType: FormType,
  values: Record<string, unknown>,
): EmailContent {
  const rows = fieldRows(values)
  const who = String(values.name ?? values.contactPerson ?? values.email ?? 'a visitor')
  const label = FORM_LABELS[formType]
  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows
    .map(
      (row) =>
        `<tr><td style="padding:8px 12px 8px 0;vertical-align:top;border-top:1px solid ${C.bead};font-weight:bold;color:${C.green};white-space:nowrap;">${escapeHtml(row.label)}</td><td style="padding:8px 0;border-top:1px solid ${C.bead};white-space:pre-wrap;">${escapeHtml(row.value)}</td></tr>`,
    )
    .join('')}</table>`
  return {
    subject: `[Website] ${label} from ${who}`,
    text: [
      `${label} from the website`,
      '',
      ...rows.map((row) => `${row.label}: ${row.value}`),
      '',
      'Reply to this email to answer the sender (when they gave an email address).',
    ].join('\n'),
    html: layout({
      title: label,
      preheader: `${label} from ${who}`,
      body:
        table +
        p(
          '<br>Reply to this email to answer the sender, if they gave an email address. The full record is in the website admin under Form submissions.',
        ),
    }),
  }
}

const ACK_INTRO: Record<FormType, string> = {
  contact: 'We have received your message.',
  volunteer: 'Thank you for offering your time. We have received your volunteer sign-up.',
  partnership: 'Thank you for your interest in working with us. We have received your enquiry.',
  'school-visit': 'Thank you for inviting us. We have received your school visit request.',
  join: 'Thank you for your interest in joining us. We have received your request.',
  pledge:
    'Thank you for your generous pledge. A pledge is a promise of intent and takes no money from you.',
  newsletter: 'Thank you for your interest in our news.',
}

const ACK_NEXT: Record<FormType, string> = {
  contact: 'A member of the team will read it and reply as soon as we can.',
  volunteer: 'A member of the team will contact you about how you can help.',
  partnership: 'A member of the team will be in touch to talk about how we can work together.',
  'school-visit':
    'A member of the team will contact you to agree a date and the topics for the visit.',
  join: 'The committee reviews each request, and a member of the team will contact you.',
  pledge:
    'A member of the team will contact you with the details for giving by M-PESA or bank transfer.',
  newsletter: '',
}

/** Branded acknowledgement for the sender, in HTML with a plain-text alternative. */
export function acknowledgementEmail(
  formType: FormType,
  name: string,
  values: Record<string, unknown>,
): EmailContent {
  const rows = fieldRows(values).filter((row) => !['Email', 'Phone'].includes(row.label))
  const greeting = name ? `Dear ${name},` : 'Hello,'
  const intro = ACK_INTRO[formType]
  const next = ACK_NEXT[formType]
  const copy = rows
    .map(
      (row) =>
        `<tr><td style="padding:6px 12px 6px 0;vertical-align:top;font-weight:bold;color:${C.green};white-space:nowrap;">${escapeHtml(row.label)}</td><td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(row.value)}</td></tr>`,
    )
    .join('')
  return {
    subject: `We received your ${FORM_LABELS[formType].toLowerCase()}`,
    text: [
      greeting,
      '',
      intro,
      next,
      '',
      ...(rows.length > 0
        ? ['A copy of what you sent:', ...rows.map((r) => `- ${r.label}: ${r.value}`), '']
        : []),
      'With thanks,',
      'Enkaji Enkitati CBO',
      'Empowering Women, Sustaining Futures',
      '',
      `Privacy notice: ${siteUrl()}/privacy`,
      'Questions? Write to info@enkajienkitaticbo.org.',
    ].join('\n'),
    html: layout({
      title: 'Thank you',
      preheader: intro,
      body:
        p(escapeHtml(greeting)) +
        p(escapeHtml(intro)) +
        (next ? p(escapeHtml(next)) : '') +
        (rows.length > 0
          ? `<p style="margin:18px 0 6px;font-weight:bold;color:${C.green};">A copy of what you sent</p><table role="presentation" cellpadding="0" cellspacing="0">${copy}</table>`
          : '') +
        p('<br>With thanks,<br><strong>Enkaji Enkitati CBO</strong>'),
      footerNote: 'You are receiving this because you used a form on our website.',
    }),
  }
}

/** Double opt-in email for the newsletter (FR-NL-01). Nothing is sent until the link is opened. */
export function confirmationEmail(confirmUrl: string, unsubscribeUrl: string): EmailContent {
  return {
    subject: 'Please confirm your newsletter subscription',
    text: [
      'Hello,',
      '',
      'Someone, we hope you, asked to receive news from Enkaji Enkitati CBO at this address.',
      'To confirm, open this link (it works for 7 days):',
      confirmUrl,
      '',
      'If you did not ask for this, ignore this email and you will not hear from us again.',
      `To make sure we never email you, use: ${unsubscribeUrl}`,
      '',
      'Enkaji Enkitati CBO',
      `Privacy notice: ${siteUrl()}/privacy`,
    ].join('\n'),
    html: layout({
      title: 'Confirm your subscription',
      preheader: 'One click to start receiving news from Enkaji Enkitati CBO.',
      body:
        p('Hello,') +
        p('Someone, we hope you, asked to receive news from Enkaji Enkitati CBO at this address.') +
        p('To confirm, press the button below. The link works for 7 days.'),
      button: { label: 'Confirm my subscription', href: confirmUrl },
      footerNote: `Did not ask for this? Ignore this email and you will not hear from us again. <a href="${escapeHtml(unsubscribeUrl)}" style="color:${C.deepGold};">Never email me</a>.`,
    }),
  }
}
