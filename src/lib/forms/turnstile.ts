import 'server-only'

const DEFAULT_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export type TurnstileResult =
  { ok: true } | { ok: false; reason: 'missing' | 'rejected' | 'unavailable' | 'not-configured' }

/** The public site key for the widget, or undefined when Turnstile is not set up. */
export const turnstileSiteKey = (): string | undefined =>
  process.env.TURNSTILE_SITE_KEY || undefined

/**
 * Verifies a Cloudflare Turnstile token on the server. A token from the browser is never trusted on
 * its own. In production a missing secret rejects every submission (fail closed); in development it
 * is skipped so forms can be tried without keys. TURNSTILE_VERIFY_URL exists only so tests can
 * point the check at a local stand-in; it defaults to Cloudflare.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return { ok: false, reason: 'not-configured' }
    console.warn('TURNSTILE_SECRET_KEY is not set: skipping the human check in development')
    return { ok: true }
  }
  if (!token) return { ok: false, reason: 'missing' }

  const body = new URLSearchParams({ secret, response: token })
  if (ip !== 'unknown') body.set('remoteip', ip)
  try {
    const response = await fetch(process.env.TURNSTILE_VERIFY_URL ?? DEFAULT_VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return { ok: false, reason: 'unavailable' }
    const result = (await response.json()) as { success?: boolean }
    return result.success === true ? { ok: true } : { ok: false, reason: 'rejected' }
  } catch (error) {
    console.error('Turnstile verification could not be completed', error)
    return { ok: false, reason: 'unavailable' }
  }
}
