import 'server-only'

import { sql } from '@payloadcms/db-postgres/drizzle'
import { createHmac } from 'node:crypto'

import { getDb } from '@/lib/db'

/** Submissions allowed per connection in the window (FR-FRM-03). */
export const RATE_LIMIT = 5
export const RATE_WINDOW_MINUTES = 10

/** The visitor's address from the proxy headers, or "unknown" when there are none. */
export function clientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

/**
 * Salted one-way hash of an IP address. It is keyed with the app secret, so it cannot be reversed
 * or compared with a hash from another site, and the address itself is never stored.
 */
export function hashIp(ip: string): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is required to hash IP addresses')
  return createHmac('sha256', secret).update(`ip-hash:v1:${ip}`).digest('hex').slice(0, 32)
}

/** True when this connection has already saved 5 submissions in the last 10 minutes (Postgres-backed). */
export async function isRateLimited(ipHash: string): Promise<boolean> {
  const db = await getDb()
  const result = await db.execute(
    sql`SELECT COUNT(*)::int AS recent FROM form_submissions
        WHERE ip_hash = ${ipHash}
          AND created_at > now() - make_interval(mins => ${RATE_WINDOW_MINUTES})`,
  )
  return Number((result.rows[0] as { recent: number } | undefined)?.recent ?? 0) >= RATE_LIMIT
}
