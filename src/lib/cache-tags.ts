/**
 * Cache tag naming convention (documented in CLAUDE.md). Fetchers wrap Payload reads in
 * unstable_cache with these tags; the afterChange hooks in src/hooks/revalidate.ts invalidate them.
 *
 *   collection:<slug>        any list or query over a collection   collection:events
 *   doc:<slug>:<key>         one document, key = slug or id         doc:events:rural-women-day-2026
 *   global:<slug>            one global                             global:site-settings
 */
export const collectionTag = (collection: string): string => `collection:${collection}`

export const docTag = (collection: string, key: string | number): string =>
  `doc:${collection}:${key}`

export const globalTag = (slug: string): string => `global:${slug}`

/** Frontend path of a CMS page document. */
export function pagePath(slug: string): string {
  if (slug === 'founder') return '/about/founder'
  if (slug === 'governance') return '/about/governance'
  return `/${slug}`
}
