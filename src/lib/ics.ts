/**
 * iCalendar (RFC 5545) and Google Calendar helpers for event pages. Times are written in UTC, which
 * every calendar app (Google, Apple, Outlook) converts to the viewer's own zone, so Nairobi events
 * land at the right local time everywhere.
 */

export type CalendarEvent = {
  slug: string
  title: string
  startsAt: string
  endsAt: string
  venue: string
  summary: string | null
  theme: string | null
  cancelled: boolean
  updatedAt: string
}

const ORGANIZER_DOMAIN = 'enkajienkitaticbo.org'

/** 2026-10-15T06:00:00.000Z becomes 20261015T060000Z. */
export function icsDate(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

/** Escapes text values: backslash, semicolon, comma and line breaks. */
export function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Folds a content line to at most 75 octets, continuing on lines that start with one space. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    // Continuation lines start with a space, which counts toward the 75 octets.
    const limit = parts.length === 0 ? 75 : 74
    if (bytes + size > limit) {
      parts.push(current)
      current = ''
      bytes = 0
    }
    current += char
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n ')
}

export function eventDescription(event: CalendarEvent, pageUrl: string): string {
  const lines = [event.summary, event.theme ? `Theme: ${event.theme}` : null, `Details: ${pageUrl}`]
  return lines.filter(Boolean).join('\n')
}

export function buildIcs(event: CalendarEvent, pageUrl: string, now: Date = new Date()): string {
  const sequence = Math.floor(new Date(event.updatedAt).getTime() / 60000) % 2147483647
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Enkaji Enkitati CBO//Website//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.slug}@${ORGANIZER_DOMAIN}`,
    `DTSTAMP:${icsDate(now.toISOString())}`,
    `DTSTART:${icsDate(event.startsAt)}`,
    `DTEND:${icsDate(event.endsAt)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `LOCATION:${icsEscape(event.venue)}`,
    `DESCRIPTION:${icsEscape(eventDescription(event, pageUrl))}`,
    `URL:${pageUrl}`,
    `STATUS:${event.cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    `SEQUENCE:${sequence}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}

/** Link that opens Google Calendar with the event filled in. */
export function googleCalendarUrl(event: CalendarEvent, pageUrl: string): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${icsDate(event.startsAt)}/${icsDate(event.endsAt)}`,
    details: eventDescription(event, pageUrl),
    location: event.venue,
    ctz: 'Africa/Nairobi',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
