import { ArrowRight, Circle, Clock, MapPin, icons } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { HoverLift, Stagger, StaggerItem } from '@/components/motion'
import { formatDay, formatLongDate, formatMonth, formatTime, sameDay } from '@/lib/format'
import type { EventCard, PostCard, ProgramCard } from '@/lib/home-data'

import { SdgBadge } from './SdgBadge'

// Lucide 1.x renamed some icons; keep the old names that editors may already have used.
const ICON_ALIASES: Record<string, string> = { Home: 'House' }

/** A Lucide icon by name, falling back to a plain circle for an unknown name. */
export function NamedIcon({ name, className }: { name: string; className?: string }) {
  const key = ICON_ALIASES[name] ?? name
  const Icon = icons[key as keyof typeof icons] ?? Circle
  return <Icon aria-hidden="true" className={className} />
}

export function DateBlock({ iso, timeZone }: { iso: string; timeZone?: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-16 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground"
    >
      <span className="font-serif text-2xl leading-none font-bold">{formatDay(iso, timeZone)}</span>
      <span className="mt-1 text-xs tracking-widest uppercase">{formatMonth(iso, timeZone)}</span>
    </span>
  )
}

function whenText(event: EventCard): string {
  const start = formatLongDate(event.startsAt)
  if (!sameDay(event.startsAt, event.endsAt)) return `${start} to ${formatLongDate(event.endsAt)}`
  return `${start}, ${formatTime(event.startsAt)} to ${formatTime(event.endsAt)}`
}

export function EventCardLink({ event }: { event: EventCard }) {
  return (
    <HoverLift className="h-full rounded-xl">
      <Link
        href={`/events/${event.slug}`}
        className="flex h-full gap-4 rounded-xl border border-border bg-white p-5"
      >
        <DateBlock iso={event.startsAt} />
        <span className="flex flex-col gap-2">
          <span className="font-serif text-lg leading-snug font-bold text-primary">
            {event.title}
          </span>
          <span className="flex items-start gap-2 text-sm text-ink">
            <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-ink" />
            {whenText(event)}
          </span>
          <span className="flex items-start gap-2 text-sm text-ink">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-ink" />
            {event.venue}
          </span>
        </span>
      </Link>
    </HoverLift>
  )
}

export function PostCardLink({ post }: { post: PostCard }) {
  return (
    <HoverLift className="h-full rounded-xl">
      <Link
        href={`/news/${post.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white"
      >
        {post.cover ? (
          <Image
            src={post.cover.url}
            alt={post.cover.alt}
            width={post.cover.width}
            height={post.cover.height}
            sizes="(min-width: 1152px) 360px, (min-width: 768px) 33vw, 100vw"
            className="h-auto w-full"
          />
        ) : (
          <span aria-hidden="true" className="block aspect-[16/10] w-full bg-bead" />
        )}
        <span className="flex flex-1 flex-col gap-2 p-5">
          <span className="font-serif text-xs font-bold tracking-[0.2em] text-accent-ink uppercase">
            {post.category}
          </span>
          <span className="font-serif text-xl leading-snug font-bold text-primary">
            {post.title}
          </span>
          <span className="text-ink">{post.excerpt}</span>
          {post.publishedAt && (
            <span className="mt-auto pt-2 text-sm text-ink">
              <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time>
            </span>
          )}
        </span>
      </Link>
    </HoverLift>
  )
}

/** The program cards: icon, title, summary and SDG badges, with a staggered entrance. */
export function ProgramCards({
  programs,
  headingLevel: Heading = 'h3',
}: {
  programs: ProgramCard[]
  /** h3 under a section heading (home); h2 when the cards follow the page h1 directly. */
  headingLevel?: 'h2' | 'h3'
}) {
  return (
    <Stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {programs.map((program) => (
        <StaggerItem as="li" key={program.id}>
          <HoverLift className="h-full rounded-xl">
            <Link
              href={`/programs/${program.slug}`}
              className="flex h-full flex-col gap-3 rounded-xl border border-border bg-white p-6"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-bead text-accent-ink">
                <NamedIcon name={program.icon} className="size-6" />
              </span>
              <Heading className="font-serif text-xl leading-snug font-bold text-primary">
                {program.title}
              </Heading>
              <p className="text-ink">{program.summary}</p>
              {program.sdgs.length > 0 && (
                <ul
                  className="mt-auto flex flex-wrap gap-2 pt-2"
                  aria-label="Sustainable Development Goals"
                >
                  {program.sdgs.map((sdg) => (
                    <li key={sdg}>
                      <SdgBadge number={sdg} compact />
                    </li>
                  ))}
                </ul>
              )}
              <span className="inline-flex items-center gap-1.5 font-semibold text-primary-soft">
                Explore this program <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </Link>
          </HoverLift>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
