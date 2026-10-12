import { TZDate } from '@date-fns/tz'

export const NAIROBI = 'Africa/Nairobi'

/**
 * Whether an event is over is always worked out from its end time. Nothing is stored or updated
 * by hand when an event finishes (the status field is only used for cancelled events).
 */
export const isOver = (endsAt: string, now: number): boolean => new Date(endsAt).getTime() < now

/** An instant as a date-fns friendly date in Nairobi time. */
export const inNairobi = (iso: string | number | Date): TZDate =>
  new TZDate(new Date(iso).getTime(), NAIROBI)

/** Site URL without a trailing slash, for absolute links in calendar files and structured data. */
export const siteUrl = (): string =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

/**
 * The current time for server-rendered pages. Event pages decide "upcoming", "past" and "full"
 * from the clock on purpose, so the render is deliberately not pure; this one helper marks that.
 */
export const currentTime = (): number => Date.now()
