import type { ServerProps } from 'payload'

import { canPublish, canReadEngagement } from '@/access/roles'

const PLACEHOLDER_COLLECTIONS = [
  { slug: 'programs', label: 'Programs' },
  { slug: 'events', label: 'Events' },
  { slug: 'posts', label: 'Posts' },
  { slug: 'albums', label: 'Albums' },
  { slug: 'team', label: 'Team' },
] as const

const card = {
  padding: '12px 16px',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 6,
  background: 'var(--theme-elevation-50)',
  minWidth: 140,
} as const

const number = { fontSize: 28, fontWeight: 700, lineHeight: 1.1 } as const

/** Admin dashboard: placeholder records still to replace (FR-SEED-02) and recent form submissions. */
export async function DashboardStats({ payload, user }: ServerProps) {
  const showPlaceholders = canPublish(user)
  const showSubmissions = canReadEngagement(user)
  if (!showPlaceholders && !showSubmissions) return null

  const placeholderCounts = showPlaceholders
    ? await Promise.all(
        PLACEHOLDER_COLLECTIONS.map(async ({ slug, label }) => {
          const { totalDocs } = await payload.count({
            collection: slug,
            where: { isPlaceholder: { equals: true } },
            overrideAccess: true,
          })
          return { slug, label, count: totalDocs }
        }),
      )
    : []
  const placeholderTotal = placeholderCounts.reduce((sum, item) => sum + item.count, 0)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const since = weekAgo.toISOString()
  const submissionsLastWeek = showSubmissions
    ? (
        await payload.count({
          collection: 'form-submissions',
          where: { createdAt: { greater_than: since } },
          overrideAccess: true,
        })
      ).totalDocs
    : null

  const adminRoute = payload.config.routes.admin

  return (
    <section aria-label="Site overview" style={{ marginBottom: 32 }}>
      <h2 style={{ marginBottom: 12 }}>Site overview</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {showPlaceholders && (
          <div style={{ ...card, borderColor: placeholderTotal > 0 ? '#c4a050' : undefined }}>
            <div style={number}>{placeholderTotal}</div>
            <div>Placeholder records left</div>
          </div>
        )}
        {showSubmissions && (
          <a
            href={`${adminRoute}/collections/form-submissions`}
            style={{ ...card, color: 'inherit', textDecoration: 'none' }}
          >
            <div style={number}>{submissionsLastWeek}</div>
            <div>Form submissions in the last 7 days</div>
          </a>
        )}
      </div>
      {showPlaceholders && placeholderTotal > 0 && (
        <ul style={{ marginTop: 12, paddingLeft: 18 }}>
          {placeholderCounts
            .filter((item) => item.count > 0)
            .map((item) => (
              <li key={item.slug}>
                <a
                  href={`${adminRoute}/collections/${item.slug}?where[isPlaceholder][equals]=true`}
                >
                  {item.label}: {item.count}
                </a>
              </li>
            ))}
        </ul>
      )}
    </section>
  )
}
