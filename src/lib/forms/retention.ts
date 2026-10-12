import type { Payload } from 'payload'

/** Form submissions are kept for 24 months (NFR-PRV-05). */
export const SUBMISSION_RETENTION_MONTHS = 24
/** Newsletter signups that were never confirmed are dropped after 30 days. */
export const UNCONFIRMED_RETENTION_DAYS = 30

export type PurgeResult = { submissions: number; unconfirmed: number }

/**
 * Deletes form submissions older than 24 months and stale unconfirmed newsletter signups. The
 * donations collection is never touched: donation records are kept for the accounts. Confirmed and
 * unsubscribed subscribers stay, because the unsubscribed list is what stops us emailing them.
 */
export async function purgeExpired(payload: Payload, now: Date = new Date()): Promise<PurgeResult> {
  const submissionCutoff = new Date(now)
  submissionCutoff.setMonth(submissionCutoff.getMonth() - SUBMISSION_RETENTION_MONTHS)
  const unconfirmedCutoff = new Date(now.getTime() - UNCONFIRMED_RETENTION_DAYS * 24 * 3600 * 1000)

  const submissions = await payload.delete({
    collection: 'form-submissions',
    where: { createdAt: { less_than: submissionCutoff.toISOString() } },
    overrideAccess: true,
    context: { skipAudit: true },
  })
  const unconfirmed = await payload.delete({
    collection: 'subscribers',
    where: {
      and: [
        { status: { equals: 'pending' } },
        { createdAt: { less_than: unconfirmedCutoff.toISOString() } },
      ],
    },
    overrideAccess: true,
    context: { skipAudit: true },
  })
  return { submissions: submissions.docs.length, unconfirmed: unconfirmed.docs.length }
}
