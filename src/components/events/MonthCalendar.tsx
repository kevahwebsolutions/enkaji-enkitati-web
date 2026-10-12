import { TZDate } from '@date-fns/tz'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { NAIROBI, inNairobi, isOver } from '@/lib/event-time'
import type { EventSummary } from '@/lib/events-data'
import { eventsUrl } from '@/lib/events-url'
import { cn } from '@/lib/utils'

const WEEK = { weekStartsOn: 1 } as const
const MAX_CHIPS = 3

type MonthCalendarProps = {
  /** Month to show, as YYYY-MM. */
  month: string
  events: EventSummary[]
  now: number
  program: string | undefined
}

/** Events keyed by Nairobi calendar day; a multi-day event appears on every day it covers. */
function eventsByDay(events: EventSummary[]): Map<string, EventSummary[]> {
  const byDay = new Map<string, EventSummary[]>()
  for (const event of events) {
    const days = eachDayOfInterval({
      start: startOfDay(inNairobi(event.startsAt)),
      end: startOfDay(inNairobi(event.endsAt)),
    })
    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd')
      byDay.set(key, [...(byDay.get(key) ?? []), event])
    }
  }
  return byDay
}

function chipClass(event: EventSummary, now: number): string {
  if (event.cancelled) return 'bg-white text-ink line-through ring-1 ring-border'
  return isOver(event.endsAt, now) ? 'bg-bead text-primary' : 'bg-primary text-primary-foreground'
}

/**
 * Month grid built with date-fns, in Nairobi time. From 640px up it is a table; below that, where a
 * seven-column grid is too tight to read, it becomes a day-by-day agenda.
 */
export function MonthCalendar({ month, events, now, program }: MonthCalendarProps) {
  const [year, monthNumber] = month.split('-').map(Number)
  const first = new TZDate(year, monthNumber - 1, 1, NAIROBI)
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(first), WEEK),
    end: endOfWeek(endOfMonth(first), WEEK),
  })
  const weeks = Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7))
  const byDay = eventsByDay(events)
  const today = inNairobi(now)
  const previous = format(addMonths(first, -1), 'yyyy-MM')
  const next = format(addMonths(first, 1), 'yyyy-MM')
  const title = format(first, 'MMMM yyyy')
  const agendaDays = days.filter(
    (day) => isSameMonth(day, first) && byDay.has(format(day, 'yyyy-MM-dd')),
  )
  const monthCount = new Set(
    agendaDays.flatMap((day) => byDay.get(format(day, 'yyyy-MM-dd')) ?? []),
  ).size

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={eventsUrl({ view: 'calendar', month: previous, program })}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border bg-white px-3 font-semibold text-primary"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          <span className="sr-only sm:not-sr-only">Previous</span>
          <span className="sr-only"> month</span>
        </Link>
        <h2 className="font-serif text-2xl font-bold text-primary" aria-live="polite">
          {title}
        </h2>
        <Link
          href={eventsUrl({ view: 'calendar', month: next, program })}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border bg-white px-3 font-semibold text-primary"
        >
          <span className="sr-only sm:not-sr-only">Next</span>
          <span className="sr-only"> month</span>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      <table className="hidden w-full table-fixed border-collapse overflow-hidden rounded-xl border border-border bg-white sm:table">
        <caption className="sr-only">
          Events in {title}: {monthCount} {monthCount === 1 ? 'event' : 'events'}
        </caption>
        <thead>
          <tr className="bg-sand text-primary">
            {weeks[0].map((day) => (
              <th key={format(day, 'EEE')} scope="col" className="px-2 py-2 text-sm font-semibold">
                {format(day, 'EEE')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={format(week[0], 'yyyy-MM-dd')} className="border-t border-border align-top">
              {week.map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const dayEvents = byDay.get(key) ?? []
                const inMonth = isSameMonth(day, first)
                return (
                  <td
                    key={key}
                    className={cn(
                      'h-28 p-1.5 align-top',
                      !inMonth && 'bg-sand/50 text-muted-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold',
                        isSameDay(day, today) ? 'bg-accent text-primary' : 'text-ink',
                      )}
                    >
                      {format(day, 'd')}
                      <span className="sr-only"> {format(day, 'MMMM')}</span>
                    </span>
                    {inMonth && (
                      <ul className="mt-1 space-y-1">
                        {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                          <li key={event.slug}>
                            <Link
                              href={`/events/${event.slug}`}
                              className={cn(
                                'block truncate rounded px-1.5 py-0.5 text-xs font-semibold',
                                chipClass(event, now),
                              )}
                            >
                              {event.title}
                            </Link>
                          </li>
                        ))}
                        {dayEvents.length > MAX_CHIPS && (
                          <li className="px-1.5 text-xs text-ink">
                            +{dayEvents.length - MAX_CHIPS} more
                          </li>
                        )}
                      </ul>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sm:hidden">
        {agendaDays.length === 0 ? (
          <p className="rounded-xl border border-border bg-white p-5 text-ink">
            No events in {title}.
          </p>
        ) : (
          <ol className="space-y-3">
            {agendaDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              return (
                <li key={key} className="rounded-xl border border-border bg-white p-4">
                  <p className="font-serif text-lg font-bold text-primary">
                    {format(day, 'EEEE d MMMM')}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {(byDay.get(key) ?? []).map((event) => (
                      <li key={event.slug}>
                        <Link
                          href={`/events/${event.slug}`}
                          className={cn(
                            'flex min-h-11 items-center rounded-lg px-3 font-semibold',
                            chipClass(event, now),
                          )}
                        >
                          {event.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded bg-primary" /> Upcoming
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded bg-bead ring-1 ring-border" /> Past
        </span>
        <span>All times are Nairobi time (EAT).</span>
      </p>
    </div>
  )
}
