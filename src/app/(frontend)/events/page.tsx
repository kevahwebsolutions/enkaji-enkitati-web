import { format } from 'date-fns'
import type { Metadata } from 'next'
import Link from 'next/link'

import { EventListCard } from '@/components/events/EventListCard'
import { EventsToolbar } from '@/components/events/EventsToolbar'
import { MonthCalendar } from '@/components/events/MonthCalendar'
import { Pagination } from '@/components/events/Pagination'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Stagger, StaggerItem } from '@/components/motion'
import { currentTime, inNairobi, isOver } from '@/lib/event-time'
import { getAllEvents } from '@/lib/events-data'
import { eventsUrl } from '@/lib/events-url'
import { getPrograms } from '@/lib/programs-data'

const PAST_PER_PAGE = 9
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

type SearchParams = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const params = await searchParams
  // Program-filtered and calendar views repeat the main lists, so they are not indexed. The plain
  // upcoming list and the paged past archive are, each with its own canonical address.
  const noindex = Boolean(first(params.program) || first(params.view) || first(params.month))
  const past = first(params.tab) === 'past'
  const pageNumber = Math.max(Number.parseInt(first(params.page) ?? '1', 10) || 1, 1)
  return {
    title: 'Events',
    description:
      'Upcoming and past events from Enkaji Enkitati CBO in Ewaso Ng’iro, Narok County: school visits, awareness days, savings group training and community celebrations.',
    alternates: { canonical: past ? eventsUrl({ tab: 'past', page: pageNumber }) : '/events' },
    robots: noindex ? { index: false, follow: true } : undefined,
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [events, programs] = await Promise.all([getAllEvents(), getPrograms()])
  // Upcoming or past is decided here, from each event's end time, every time the page is rendered.
  const now = currentTime()

  const view = first(params.view) === 'calendar' ? 'calendar' : 'list'
  const tab = first(params.tab) === 'past' ? 'past' : 'upcoming'
  const programParam = first(params.program)
  const program = programs.find((item) => item.slug === programParam)?.slug
  const monthParam = first(params.month)
  const month =
    monthParam && MONTH.test(monthParam) ? monthParam : format(inNairobi(now), 'yyyy-MM')

  const filtered = program
    ? events.filter((event) => event.programs.some((item) => item.slug === program))
    : events
  const upcoming = filtered.filter((event) => !isOver(event.endsAt, now))
  // Cancelled events that never took place are not archived.
  const past = filtered
    .filter((event) => isOver(event.endsAt, now) && !event.cancelled)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))

  const totalPages = Math.max(Math.ceil(past.length / PAST_PER_PAGE), 1)
  const page = Math.min(
    Math.max(Number.parseInt(first(params.page) ?? '1', 10) || 1, 1),
    totalPages,
  )
  const pastPage = past.slice((page - 1) * PAST_PER_PAGE, page * PAST_PER_PAGE)

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="What is happening"
        lead="School visits, awareness days, savings training and celebrations in Ewaso Ng’iro. All times are Nairobi time."
        breadcrumb={[{ label: 'Events' }]}
      />

      <Section aria-label="Events">
        <EventsToolbar
          view={view}
          tab={tab}
          program={program}
          month={month}
          programs={programs}
          counts={{ upcoming: upcoming.length, past: past.length }}
        />

        <div className="mt-8">
          {view === 'calendar' ? (
            <MonthCalendar month={month} events={filtered} now={now} program={program} />
          ) : tab === 'upcoming' ? (
            upcoming.length > 0 ? (
              <Stagger as="ul" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((event) => (
                  <StaggerItem as="li" key={event.id}>
                    <EventListCard event={event} headingLevel="h2" />
                  </StaggerItem>
                ))}
              </Stagger>
            ) : (
              <div className="max-w-2xl rounded-xl border border-border bg-white p-6">
                <p className="text-lg text-ink">
                  No upcoming events{program ? ' for this program' : ''} are scheduled right now.
                </p>
                <p className="mt-3">
                  <Link
                    href={eventsUrl({ tab: 'past', program })}
                    className="font-semibold text-primary-soft underline underline-offset-4"
                  >
                    See past events
                  </Link>
                </p>
              </div>
            )
          ) : pastPage.length > 0 ? (
            <>
              <Stagger as="ul" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pastPage.map((event) => (
                  <StaggerItem as="li" key={event.id}>
                    <EventListCard event={event} past headingLevel="h2" />
                  </StaggerItem>
                ))}
              </Stagger>
              <Pagination
                page={page}
                totalPages={totalPages}
                label="Past events pages"
                hrefFor={(target) => eventsUrl({ tab: 'past', program, page: target })}
              />
            </>
          ) : (
            <p className="max-w-2xl rounded-xl border border-border bg-white p-6 text-lg text-ink">
              No past events{program ? ' for this program' : ''} yet.
            </p>
          )}
        </div>
      </Section>
    </>
  )
}
