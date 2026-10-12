// @vitest-environment node
import ICAL from 'ical.js'
import { describe, expect, it } from 'vitest'

import { isOver } from '@/lib/event-time'
import { buildIcs, foldLine, googleCalendarUrl, icsEscape, type CalendarEvent } from '@/lib/ics'
import { eventJsonLd, jsonLd } from '@/lib/jsonld'
import { normaliseKenyanPhone } from '@/lib/phone'
import { DEFAULT_SPONSOR_TIERS } from '@/lib/sponsor-tiers'
import { sectionBody, splitSections, tableRows, readContent } from '../../src/seed/content'

const event: CalendarEvent = {
  slug: 'rural-women-day-2026',
  title: 'International Day of Rural Women',
  startsAt: '2026-10-15T09:00:00+03:00',
  endsAt: '2026-10-15T15:00:00+03:00',
  venue: 'Ewaso Ng’iro, Narok',
  summary:
    'An exhibition of women’s products, a savings group training session, speeches; and a long description that goes on so that the line must be folded, with commas, semicolons and a newline.\nSecond line.',
  theme: 'Celebrating rural women',
  cancelled: false,
  updatedAt: '2026-10-11T12:00:00.000Z',
}

describe('calendar file', () => {
  const text = buildIcs(
    event,
    'https://enkajienkitaticbo.org/events/rural-women-day-2026',
    new Date('2026-10-11T12:00:00Z'),
  )
  const vevent = new ICAL.Component(ICAL.parse(text)).getFirstSubcomponent('vevent')!
  const parsed = new ICAL.Event(vevent)

  it('parses as a valid iCalendar document with CRLF line endings', () => {
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(text.replace(/\r\n/g, '')).not.toContain('\n')
  })

  it('keeps the start and end as the same instants, in UTC', () => {
    expect(text).toContain('DTSTART:20261015T060000Z')
    expect(text).toContain('DTEND:20261015T120000Z')
    expect(parsed.startDate.toJSDate().toISOString()).toBe('2026-10-15T06:00:00.000Z')
    expect(parsed.endDate.toJSDate().toISOString()).toBe('2026-10-15T12:00:00.000Z')
  })

  it('round-trips the title, venue, description and a stable UID', () => {
    expect(parsed.summary).toBe(event.title)
    expect(parsed.location).toBe(event.venue)
    expect(parsed.description).toContain('Second line.')
    expect(parsed.description).toContain('savings group training session, speeches; and')
    expect(parsed.description).toContain(
      'Details: https://enkajienkitaticbo.org/events/rural-women-day-2026',
    )
    expect(parsed.uid).toBe('rural-women-day-2026@enkajienkitaticbo.org')
  })

  it('folds every line to 75 octets or fewer', () => {
    for (const line of text.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    }
  })

  it('marks a cancelled event as CANCELLED', () => {
    expect(buildIcs({ ...event, cancelled: true }, 'https://x.test/e')).toContain(
      'STATUS:CANCELLED',
    )
  })
})

describe('calendar text helpers', () => {
  it('escapes backslashes, semicolons, commas and newlines', () => {
    expect(icsEscape('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne')
  })

  it('never splits a multi-byte character when folding', () => {
    const folded = foldLine(`SUMMARY:${'’'.repeat(60)}`)
    expect(folded.split('\r\n ').join('')).toBe(`SUMMARY:${'’'.repeat(60)}`)
  })

  it('builds a Google Calendar link with the UTC range', () => {
    const url = new URL(googleCalendarUrl(event, 'https://x.test/e'))
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
    expect(url.searchParams.get('dates')).toBe('20261015T060000Z/20261015T120000Z')
    expect(url.searchParams.get('text')).toBe(event.title)
    expect(url.searchParams.get('location')).toBe(event.venue)
  })
})

describe('upcoming and past', () => {
  const end = '2026-10-15T15:00:00+03:00'
  const endMs = new Date(end).getTime()

  it('is upcoming until the end time, then past', () => {
    expect(isOver(end, endMs - 1)).toBe(false)
    expect(isOver(end, endMs)).toBe(false)
    expect(isOver(end, endMs + 1)).toBe(true)
  })
})

describe('structured data', () => {
  it('describes an Event with Nairobi offsets and the cancelled status', () => {
    const data = eventJsonLd({
      name: event.title,
      url: 'https://x.test/e',
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      venue: event.venue,
      summary: null,
      imageUrl: null,
      cancelled: true,
      orgName: 'Enkaji Enkitati CBO',
      orgUrl: 'https://x.test',
    })
    expect(data['@type']).toBe('Event')
    expect(data.startDate).toBe('2026-10-15T09:00:00+03:00')
    expect(data.endDate).toBe('2026-10-15T15:00:00+03:00')
    expect(data.eventStatus).toBe('https://schema.org/EventCancelled')
  })

  it('cannot close its own script tag', () => {
    expect(jsonLd({ name: '</script><script>alert(1)</script>' })).not.toContain('</script>')
  })
})

describe('Kenyan phone numbers', () => {
  it.each([
    ['0712 345 678', '254712345678'],
    ['0112345678', '254112345678'],
    ['+254 712 345 678', '254712345678'],
    ['254712345678', '254712345678'],
    ['712-345-678', '254712345678'],
    ['(0712) 345678', '254712345678'],
  ])('normalises %s', (input, expected) => {
    expect(normaliseKenyanPhone(input)).toBe(expected)
  })

  it.each(['', '12345', '0212345678', '+44 7700 900123', '07123456789', 'abc'])(
    'rejects %s',
    (input) => {
      expect(normaliseKenyanPhone(input)).toBeNull()
    },
  )
})

describe('default sponsor tiers', () => {
  it('match the table in enkaji-content/content/partner.md', async () => {
    const source = await readContent('partner.md')
    const rows = tableRows(sectionBody(splitSections(source), 'event sponsorship tiers'))
    const fromFile = rows.map(([name, minimum, benefits]) => ({
      name,
      minimumKes: Number(minimum.replace(/\D/g, '')),
      benefits,
    }))
    expect(DEFAULT_SPONSOR_TIERS).toEqual(fromFile)
  })
})
