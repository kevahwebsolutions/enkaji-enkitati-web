export type EventsQuery = {
  view?: 'list' | 'calendar'
  tab?: 'upcoming' | 'past'
  program?: string
  page?: number
  /** Calendar month as YYYY-MM. */
  month?: string
}

/**
 * Builds a /events link. Defaults are left out, so the plain list of upcoming events is just
 * /events. All the state lives in the URL, so every view can be shared and bookmarked, and the
 * page needs no client-side JavaScript.
 */
export function eventsUrl(query: EventsQuery = {}): string {
  const params = new URLSearchParams()
  if (query.view === 'calendar') {
    params.set('view', 'calendar')
    if (query.month) params.set('month', query.month)
  } else {
    if (query.tab === 'past') params.set('tab', 'past')
    if (query.tab === 'past' && query.page && query.page > 1) params.set('page', String(query.page))
  }
  if (query.program) params.set('program', query.program)
  const search = params.toString()
  return search ? `/events?${search}` : '/events'
}
