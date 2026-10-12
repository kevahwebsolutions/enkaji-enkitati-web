import Link from 'next/link'

import { DateBlock } from '@/components/sections/cards'
import { formatLongDate, formatTime, sameDay } from '@/lib/format'
import type { EventSummary } from '@/lib/events-data'
import { eventsUrl } from '@/lib/events-url'
import { cn } from '@/lib/utils'

function whenText(event: EventSummary): string {
  const start = formatLongDate(event.startsAt)
  if (!sameDay(event.startsAt, event.endsAt)) return `${start} to ${formatLongDate(event.endsAt)}`
  return `${start}, ${formatTime(event.startsAt)} to ${formatTime(event.endsAt)}`
}

/** Event in the list: date block, title, time, venue, short summary and program tags. */
export function EventListCard({
  event,
  past = false,
  headingLevel: Heading = 'h3',
}: {
  event: EventSummary
  past?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  return (
    <article
      className={cn(
        'relative flex h-full gap-4 rounded-xl border border-border bg-white p-5',
        past && 'bg-white/70',
      )}
    >
      <DateBlock iso={event.startsAt} />
      <div className="flex min-w-0 flex-col gap-2">
        <Heading className="font-serif text-lg leading-snug font-bold text-primary">
          {/* The stretched link makes the whole card clickable while the tags stay separate links. */}
          <Link
            href={`/events/${event.slug}`}
            className="after:absolute after:inset-0 after:rounded-xl"
          >
            {event.title}
          </Link>
        </Heading>
        {event.cancelled && (
          <p className="w-fit rounded-full bg-destructive px-3 py-0.5 text-sm font-semibold text-white">
            Cancelled
          </p>
        )}
        <p className="text-sm text-ink">{whenText(event)}</p>
        <p className="text-sm text-ink">{event.venue}</p>
        {event.summary && <p className="line-clamp-3 text-ink">{event.summary}</p>}
        {event.programs.length > 0 && (
          <ul className="relative z-10 mt-1 flex flex-wrap gap-2" aria-label="Programs">
            {event.programs.map((program) => (
              <li key={program.slug}>
                <Link
                  href={eventsUrl({ program: program.slug })}
                  className="inline-flex min-h-8 items-center rounded-full bg-bead px-3 text-sm font-semibold text-primary hover:bg-[#e6d9b4]"
                >
                  {program.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}
