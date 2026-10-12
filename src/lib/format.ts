const TIME_ZONE = 'Africa/Nairobi'

const part = (options: Intl.DateTimeFormatOptions, iso: string, timeZone = TIME_ZONE): string =>
  new Intl.DateTimeFormat('en-GB', { timeZone, ...options }).format(new Date(iso))

/** Day of the month, for example "15". Event times are always shown in Nairobi time. */
export const formatDay = (iso: string, timeZone?: string): string =>
  part({ day: 'numeric' }, iso, timeZone)

/** Short month, for example "Oct". */
export const formatMonth = (iso: string, timeZone?: string): string =>
  part({ month: 'short' }, iso, timeZone)

/** For example "15 October 2026". */
export const formatLongDate = (iso: string, timeZone?: string): string =>
  part({ day: 'numeric', month: 'long', year: 'numeric' }, iso, timeZone)

/** For example "9:00 am". */
export const formatTime = (iso: string): string =>
  part({ hour: 'numeric', minute: '2-digit', hour12: true }, iso).replace(/\s?([ap])m/i, ' $1m')

/** True when both ISO dates fall on the same Nairobi calendar day. */
export const sameDay = (a: string, b: string): boolean =>
  part({ dateStyle: 'short' }, a) === part({ dateStyle: 'short' }, b)
