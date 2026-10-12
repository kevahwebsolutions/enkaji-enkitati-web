import 'server-only'

import path from 'node:path'
import nodemailer, { type Transporter } from 'nodemailer'

export type MailResult = 'sent' | 'failed' | 'skipped'

export type OutgoingMail = {
  to: string
  subject: string
  text: string
  html: string
  replyTo?: string
  headers?: Record<string, string>
}

let cached: Transporter | null | undefined

/** SMTP transport from the SMTP_* variables, or null when no host is configured. */
function transport(): Transporter | null {
  if (cached !== undefined) return cached
  const host = process.env.SMTP_HOST
  if (!host) {
    cached = null
    return cached
  }
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  cached = nodemailer.createTransport({
    host,
    port,
    // Port 465 is TLS from the first byte; other ports upgrade with STARTTLS when offered.
    secure: port === 465,
    auth: user ? { user, pass: process.env.SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
  return cached
}

/** Drops line breaks so a value can never add headers to an email. */
export const headerSafe = (value: string): string => value.replace(/[\r\n]+/g, ' ').trim()

/** The sender shown on every email, for example "Enkaji Enkitati CBO <info@enkajienkitaticbo.org>". */
export const mailFrom = (): string =>
  process.env.MAIL_FROM ?? 'Enkaji Enkitati CBO <info@enkajienkitaticbo.org>'

/** The inbox that receives every submission. */
export const contactInbox = (): string => process.env.CONTACT_INBOX ?? 'info@enkajienkitaticbo.org'

/**
 * Sends one email with the cream logo embedded. Returns "skipped" when SMTP is not configured and
 * "failed" (after logging) when delivery fails, so callers can keep the submission either way.
 */
export async function sendMail(mail: OutgoingMail): Promise<MailResult> {
  const smtp = transport()
  if (!smtp) {
    console.warn(`SMTP_HOST is not set: not sending "${mail.subject}"`)
    return 'skipped'
  }
  try {
    await smtp.sendMail({
      from: mailFrom(),
      to: mail.to,
      replyTo: mail.replyTo,
      subject: headerSafe(mail.subject),
      text: mail.text,
      html: mail.html,
      headers: mail.headers,
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(process.cwd(), 'public', 'brand', 'logo-mark-cream.png'),
          cid: 'logo-mark',
        },
      ],
    })
    return 'sent'
  } catch (error) {
    console.error(`Could not send "${mail.subject}"`, error)
    return 'failed'
  }
}

/** Forgets the cached SMTP transport so the next send re-reads the SMTP_* variables. Tests only. */
export function resetMailTransport(): void {
  cached = undefined
}
