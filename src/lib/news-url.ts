export const CATEGORIES = ['News', 'Stories', 'Press', 'Reports'] as const
export type Category = (typeof CATEGORIES)[number]

export const isCategory = (value: string | undefined): value is Category =>
  CATEGORIES.includes(value as Category)

export type NewsQuery = { category?: Category; q?: string; page?: number }

/**
 * Builds a /news link. Category, search and page are all in the URL, so they combine, can be
 * shared, and work without JavaScript. Changing the category or the search starts at page 1.
 */
export function newsUrl(query: NewsQuery = {}): string {
  const params = new URLSearchParams()
  if (query.category) params.set('category', query.category)
  const q = query.q?.trim()
  if (q) params.set('q', q)
  if (query.page && query.page > 1) params.set('page', String(query.page))
  const search = params.toString()
  return search ? `/news?${search}` : '/news'
}
