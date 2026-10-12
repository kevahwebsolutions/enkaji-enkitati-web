import { CalendarDays, List } from 'lucide-react'
import Link from 'next/link'

import { eventsUrl, type EventsQuery } from '@/lib/events-url'
import { cn } from '@/lib/utils'

const segment = (active: boolean) =>
  cn(
    'inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-base font-semibold',
    active ? 'bg-primary text-primary-foreground' : 'text-primary hover:bg-bead/70',
  )

const chip = (active: boolean) =>
  cn(
    'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-white text-primary hover:border-primary-soft',
  )

type ToolbarProps = {
  view: 'list' | 'calendar'
  tab: 'upcoming' | 'past'
  program: string | undefined
  month: string
  programs: Array<{ slug: string; title: string }>
  counts: { upcoming: number; past: number }
}

/**
 * Tabs, view toggle and program filter. Everything is a plain link to a URL, so it works without
 * JavaScript, and screen readers get current-page state from aria-current.
 */
export function EventsToolbar({ view, tab, program, month, programs, counts }: ToolbarProps) {
  const base: EventsQuery = { program, month }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {view === 'list' ? (
          <nav aria-label="Event lists">
            <ul className="flex gap-2 rounded-xl bg-sand p-1">
              <li>
                <Link
                  href={eventsUrl({ ...base, view: 'list', tab: 'upcoming' })}
                  aria-current={tab === 'upcoming' ? 'page' : undefined}
                  className={segment(tab === 'upcoming')}
                >
                  Upcoming <span className="font-normal">({counts.upcoming})</span>
                </Link>
              </li>
              <li>
                <Link
                  href={eventsUrl({ ...base, view: 'list', tab: 'past' })}
                  aria-current={tab === 'past' ? 'page' : undefined}
                  className={segment(tab === 'past')}
                >
                  Past <span className="font-normal">({counts.past})</span>
                </Link>
              </li>
            </ul>
          </nav>
        ) : (
          <p className="font-serif text-xl font-bold text-primary">Month view</p>
        )}

        <nav aria-label="Event view">
          <ul className="flex gap-2 rounded-xl bg-sand p-1">
            <li>
              <Link
                href={eventsUrl({ program, view: 'list', tab })}
                aria-current={view === 'list' ? 'page' : undefined}
                className={segment(view === 'list')}
              >
                <List aria-hidden="true" className="size-4" /> List
              </Link>
            </li>
            <li>
              <Link
                href={eventsUrl({ program, view: 'calendar', month })}
                aria-current={view === 'calendar' ? 'page' : undefined}
                className={segment(view === 'calendar')}
              >
                <CalendarDays aria-hidden="true" className="size-4" /> Calendar
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {programs.length > 0 && (
        <nav aria-label="Filter by program">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={eventsUrl({ view, tab, month })}
                aria-current={!program ? 'page' : undefined}
                className={chip(!program)}
              >
                All programs
              </Link>
            </li>
            {programs.map((item) => (
              <li key={item.slug}>
                <Link
                  href={eventsUrl({ view, tab, month, program: item.slug })}
                  aria-current={program === item.slug ? 'page' : undefined}
                  className={chip(program === item.slug)}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
