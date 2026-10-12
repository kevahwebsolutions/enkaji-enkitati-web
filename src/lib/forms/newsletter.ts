import 'server-only'

import config from '@payload-config'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { getPayload } from 'payload'

import { siteUrl } from '@/lib/event-time'
import { confirmationEmail } from '@/lib/forms/templates'
import { sendMail, type MailResult } from '@/lib/forms/mail'

export const CONFIRM_TTL_DAYS = 7

type Purpose = 'confirm' | 'unsubscribe'

const base64url = (buffer: Buffer): string => buffer.toString('base64url')

function secret(): string {
  const value = process.env.PAYLOAD_SECRET
  if (!value) throw new Error('PAYLOAD_SECRET is required to sign newsletter links')
  return value
}

function sign(purpose: Purpose, id: number, expires: number, subscriberToken: string): string {
  return base64url(
    createHmac('sha256', secret())
      .update(`newsletter:${purpose}:${id}:${expires}:${subscriberToken}`)
      .digest(),
  )
}

/**
 * Signed link token: "<subscriber id>.<expiry>.<signature>". The signature covers the purpose, the
 * subscriber, the expiry and the subscriber's own random token, so a confirm link cannot be used to
 * unsubscribe, a link cannot be edited, and changing the stored token cancels every earlier link.
 * Confirm links expire after 7 days; unsubscribe links never do, so old emails keep working.
 */
export function createToken(
  purpose: Purpose,
  subscriber: { id: number; token: string },
  now: number = Date.now(),
): string {
  const expires = purpose === 'confirm' ? now + CONFIRM_TTL_DAYS * 24 * 3600 * 1000 : 0
  return `${subscriber.id}.${expires}.${sign(purpose, subscriber.id, expires, subscriber.token)}`
}

type Verified =
  | {
      ok: true
      id: number
      subscriber: { id: number; email: string; status: string; token: string }
    }
  | { ok: false; reason: 'invalid' | 'expired' }

export async function verifyToken(
  purpose: Purpose,
  token: string,
  now: number = Date.now(),
): Promise<Verified> {
  const [idPart, expiresPart, signature] = token.split('.')
  const id = Number(idPart)
  const expires = Number(expiresPart)
  if (!Number.isInteger(id) || !Number.isFinite(expires) || !signature) {
    return { ok: false, reason: 'invalid' }
  }

  const payload = await getPayload({ config })
  const subscriber = await payload
    .findByID({
      collection: 'subscribers',
      id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    .catch(() => null)
  if (!subscriber?.token) return { ok: false, reason: 'invalid' }

  const expected = Buffer.from(sign(purpose, id, expires, subscriber.token))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'invalid' }
  }
  if (purpose === 'confirm' && expires < now) return { ok: false, reason: 'expired' }

  return {
    ok: true,
    id,
    subscriber: {
      id: subscriber.id,
      email: subscriber.email,
      status: subscriber.status,
      token: subscriber.token,
    },
  }
}

export const confirmUrl = (token: string): string =>
  `${siteUrl()}/newsletter/confirm?t=${encodeURIComponent(token)}`
export const unsubscribeUrl = (token: string): string =>
  `${siteUrl()}/newsletter/unsubscribe?t=${encodeURIComponent(token)}`

export type SubscribeResult = { sent: boolean; mail: MailResult | 'not-needed' }

/**
 * Starts (or restarts) a double opt-in. A new address becomes "pending". An address that is already
 * confirmed gets no email. A pending or unsubscribed address gets a fresh confirmation link, and
 * the older links stop working. The visitor sees the same answer in every case, so nobody can use
 * the form to find out who is subscribed.
 */
export async function subscribe(rawEmail: string): Promise<SubscribeResult> {
  const email = rawEmail.trim().toLowerCase()
  const payload = await getPayload({ config })
  const found = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const existing = found.docs[0]
  if (existing?.status === 'confirmed') return { sent: false, mail: 'not-needed' }

  const freshToken = randomBytes(24).toString('hex')
  const subscriber = existing
    ? await payload.update({
        collection: 'subscribers',
        id: existing.id,
        data: { status: 'pending', token: freshToken },
        overrideAccess: true,
        context: { skipAudit: true },
      })
    : await payload.create({
        collection: 'subscribers',
        data: { email, status: 'pending', token: freshToken },
        overrideAccess: true,
        context: { skipAudit: true },
      })

  const tokenFor = (purpose: Purpose) =>
    createToken(purpose, { id: subscriber.id, token: freshToken })
  const mail = confirmationEmail(
    confirmUrl(tokenFor('confirm')),
    unsubscribeUrl(tokenFor('unsubscribe')),
  )
  const result = await sendMail({ to: email, ...mail })
  return { sent: result === 'sent', mail: result }
}

export type ConfirmResult = 'confirmed' | 'already' | 'expired' | 'invalid'

export async function confirmSubscription(token: string): Promise<ConfirmResult> {
  const verified = await verifyToken('confirm', token)
  if (!verified.ok) return verified.reason
  if (verified.subscriber.status === 'confirmed') return 'already'
  // An unsubscribed address can only come back through a new signup, which issues a new token.
  if (verified.subscriber.status !== 'pending') return 'invalid'

  const payload = await getPayload({ config })
  await payload.update({
    collection: 'subscribers',
    id: verified.id,
    data: { status: 'confirmed' },
    overrideAccess: true,
    context: { skipAudit: true },
  })
  return 'confirmed'
}

export type UnsubscribeResult = 'unsubscribed' | 'already' | 'invalid'

export async function unsubscribe(token: string): Promise<UnsubscribeResult> {
  const verified = await verifyToken('unsubscribe', token)
  if (!verified.ok) return 'invalid'
  if (verified.subscriber.status === 'unsubscribed') return 'already'

  const payload = await getPayload({ config })
  // The record stays, marked unsubscribed, so we never email this address again.
  await payload.update({
    collection: 'subscribers',
    id: verified.id,
    data: { status: 'unsubscribed' },
    overrideAccess: true,
    context: { skipAudit: true },
  })
  return 'unsubscribed'
}
