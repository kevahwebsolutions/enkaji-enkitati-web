// @vitest-environment node
import config from '@payload-config'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres/drizzle'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// The module is marked server-only for Next.js; outside Next that import must be a no-op.
vi.mock('server-only', () => ({}))

const { createRsvp, getRsvpTotal, hashIp, isRateLimited } = await import('@/lib/rsvp')

const run = Date.now()
let payload: Payload
const eventIds: number[] = []

async function makeEvent(capacity: number | null): Promise<number> {
  const event = await payload.create({
    collection: 'events',
    data: {
      title: `RSVP test ${run}-${eventIds.length}`,
      slug: `rsvp-test-${run}-${eventIds.length}`,
      startsAt: '2030-01-01T09:00:00+03:00',
      endsAt: '2030-01-01T12:00:00+03:00',
      venue: 'Test venue',
      rsvpEnabled: true,
      status: 'upcoming',
      capacity: capacity ?? undefined,
      _status: 'published',
    },
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
  eventIds.push(event.id)
  return event.id
}

const person = (eventId: number, attendees = 1, n = 0) => ({
  eventId,
  name: `Guest ${n}`,
  email: `guest${n}-${run}@example.test`,
  phone: null,
  organization: null,
  attendees,
})

beforeAll(async () => {
  payload = await getPayload({ config: await config })
}, 120_000)

afterAll(async () => {
  const db = (payload.db as unknown as PostgresAdapter).drizzle
  for (const id of eventIds) {
    await db.execute(
      sql`DELETE FROM form_submissions WHERE form_type = 'rsvp' AND data->>'eventId' = ${String(id)}`,
    )
    await payload.delete({
      collection: 'events',
      id,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
  }
  await db.execute(sql`DELETE FROM form_submissions WHERE ip_hash LIKE ${`rl-${run}%`}`)
})

describe('RSVP capacity', () => {
  it('lets exactly the capacity through when many people register at the same moment', async () => {
    const eventId = await makeEvent(5)
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, n) => createRsvp(person(eventId, 1, n), 5, `rl-${run}-a`)),
    )
    expect(results.filter((r) => r.ok)).toHaveLength(5)
    expect(results.filter((r) => !r.ok)).toHaveLength(7)
    expect(await getRsvpTotal(eventId)).toBe(5)
  }, 60_000)

  it('turns away a group that does not fit and tells it how many places are left', async () => {
    const eventId = await makeEvent(5)
    expect((await createRsvp(person(eventId, 4, 1), 5, `rl-${run}-b`)).ok).toBe(true)
    const tooMany = await createRsvp(person(eventId, 2, 2), 5, `rl-${run}-b`)
    expect(tooMany).toEqual({ ok: false, reason: 'full', remaining: 1 })
    const last = await createRsvp(person(eventId, 1, 3), 5, `rl-${run}-b`)
    expect(last).toEqual({ ok: true, remaining: 0 })
    const full = await createRsvp(person(eventId, 1, 4), 5, `rl-${run}-b`)
    expect(full).toEqual({ ok: false, reason: 'full', remaining: 0 })
  }, 60_000)

  it('has no limit when the event has no capacity', async () => {
    const eventId = await makeEvent(null)
    const results = await Promise.all(
      Array.from({ length: 6 }, (_, n) => createRsvp(person(eventId, 3, n), null, `rl-${run}-c`)),
    )
    expect(results.every((r) => r.ok)).toBe(true)
    expect(await getRsvpTotal(eventId)).toBe(18)
  }, 60_000)
})

describe('rate limit and IP hashing', () => {
  it('blocks the sixth submission from one connection within ten minutes', async () => {
    const eventId = await makeEvent(null)
    const ipHash = `rl-${run}-d`
    for (let n = 0; n < 5; n++) {
      expect(await isRateLimited(ipHash)).toBe(false)
      await createRsvp(person(eventId, 1, n), null, ipHash)
    }
    expect(await isRateLimited(ipHash)).toBe(true)
  }, 60_000)

  it('stores a one-way hash, never the address', () => {
    const hash = hashIp('203.0.113.7')
    expect(hash).toMatch(/^[0-9a-f]{32}$/)
    expect(hash).not.toContain('203')
    expect(hashIp('203.0.113.7')).toBe(hash)
    expect(hashIp('203.0.113.8')).not.toBe(hash)
  })
})
