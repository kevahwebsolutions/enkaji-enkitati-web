import { CalendarDays } from 'lucide-react'

import { Section } from '@/components/layout/Section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { formatLongDate } from '@/lib/format'
import type { CalendarDate, EventCard } from '@/lib/home-data'

import { DateBlock, EventCardLink } from './cards'
import { SectionHeading } from './SectionHeading'

/**
 * Next three upcoming events. When none are scheduled it shows the next three days on the CBO's
 * advocacy calendar instead, so the section is never empty.
 */
export function UpcomingEvents({
  events,
  calendar,
}: {
  events: EventCard[]
  calendar: CalendarDate[]
}) {
  const hasEvents = events.length > 0
  if (!hasEvents && calendar.length === 0) return null

  return (
    <Section tone="sand" aria-labelledby="events-title">
      <Reveal>
        <SectionHeading
          id="events-title"
          eyebrow={hasEvents ? 'What is coming up' : 'Dates to mark'}
          title={hasEvents ? 'Upcoming events' : 'No events scheduled yet'}
          intro={
            hasEvents
              ? undefined
              : 'These are the next days on our advocacy calendar. We plan an activity for each.'
          }
          action={{ label: 'All events', href: '/events' }}
        />
      </Reveal>
      <Stagger as="ul" className="grid gap-6 md:grid-cols-3">
        {hasEvents
          ? events.map((event) => (
              <StaggerItem as="li" key={event.id}>
                <EventCardLink event={event} />
              </StaggerItem>
            ))
          : calendar.map((entry) => (
              <StaggerItem as="li" key={`${entry.date}-${entry.name}`}>
                <div className="flex h-full gap-4 rounded-xl border border-border bg-white p-5">
                  <DateBlock iso={entry.date} timeZone="UTC" />
                  <span className="flex flex-col gap-2">
                    <span className="font-serif text-lg leading-snug font-bold text-primary">
                      {entry.name}
                    </span>
                    <span className="flex items-start gap-2 text-sm text-ink">
                      <CalendarDays
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-accent-ink"
                      />
                      <span>
                        <span className="sr-only">{formatLongDate(entry.date, 'UTC')}. </span>
                        {entry.activity}
                      </span>
                    </span>
                  </span>
                </div>
              </StaggerItem>
            ))}
      </Stagger>
    </Section>
  )
}
