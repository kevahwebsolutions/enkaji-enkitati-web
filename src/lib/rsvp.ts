import 'server-only'

import { sql } from '@payloadcms/db-postgres/drizzle'

import { getDb } from '@/lib/db'

/** Namespace for the per-event advisory lock (the second key is the event id). */
const RSVP_LOCK_NAMESPACE = 7301

export type RsvpRecord = {
  eventId: number
  name: string
  email: string | null
  phone: string | null
  organization: string | null
  attendees: number
}

const database = getDb

type Executor = Pick<Awaited<ReturnType<typeof database>>, 'execute'>

async function totalFor(executor: Executor, eventId: number): Promise<number> {
  const result = await executor.execute(
    sql`SELECT COALESCE(SUM((data->>'attendees')::int), 0)::int AS total
        FROM form_submissions
        WHERE form_type = 'rsvp' AND data->>'eventId' = ${String(eventId)}`,
  )
  return Number((result.rows[0] as { total: number } | undefined)?.total ?? 0)
}

/** Places already taken for an event, counted from RSVP submissions. */
export async function getRsvpTotal(eventId: number): Promise<number> {
  return totalFor(await database(), eventId)
}

export { hashIp, isRateLimited } from '@/lib/forms/guard'

export type RsvpResult =
  { ok: true; remaining: number | null } | { ok: false; reason: 'full'; remaining: number }

/**
 * Saves an RSVP, enforcing the event's capacity. The count and the insert run in one transaction
 * behind a per-event advisory lock, so two people registering at the same moment cannot both take
 * the last places.
 */
export async function createRsvp(
  record: RsvpRecord,
  capacity: number | null,
  ipHash: string,
): Promise<RsvpResult> {
  const db = await database()
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${RSVP_LOCK_NAMESPACE}, ${record.eventId})`)

    if (capacity !== null) {
      const taken = await totalFor(tx, record.eventId)
      const remaining = Math.max(capacity - taken, 0)
      if (record.attendees > remaining) return { ok: false, reason: 'full', remaining } as const
    }

    await tx.execute(
      sql`INSERT INTO form_submissions (form_type, data, consent, ip_hash)
          VALUES ('rsvp', ${JSON.stringify(record)}::jsonb, true, ${ipHash})`,
    )
    const taken = await totalFor(tx, record.eventId)
    return {
      ok: true,
      remaining: capacity === null ? null : Math.max(capacity - taken, 0),
    } as const
  })
}
