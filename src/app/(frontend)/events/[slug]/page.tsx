import { CalendarDays, Clock, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AddToCalendar, AgendaTimeline, SponsorTiers } from '@/components/events/EventBlocks'
import { RsvpForm } from '@/components/events/RsvpForm'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal } from '@/components/motion'
import { GalleryStrip } from '@/components/programs/ProgramBlocks'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { Button } from '@/components/ui/button'
import { currentTime, isOver, siteUrl } from '@/lib/event-time'
import { getEvent, getEventRecap, getEventSlugs } from '@/lib/events-data'
import { eventsUrl } from '@/lib/events-url'
import { formatLongDate, formatTime, sameDay } from '@/lib/format'
import { buildIcs, googleCalendarUrl, type CalendarEvent } from '@/lib/ics'
import { eventJsonLd, jsonLd } from '@/lib/jsonld'
import { getRsvpTotal } from '@/lib/rsvp'
import { getPublicSiteSettings } from '@/lib/site-settings'

type Params = { slug: string }

// Registration and "past" status depend on the clock, so the page refreshes every minute. A
// publish in the CMS refreshes it immediately through its cache tags.
export const revalidate = 60

export async function generateStaticParams(): Promise<Params[]> {
  return (await getEventSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) return { title: 'Event not found' }
  return {
    title: event.meta.title || event.title,
    description:
      event.meta.description ||
      event.summary ||
      `${event.title}, ${formatLongDate(event.startsAt)}, ${event.venue}.`,
    alternates: { canonical: `/events/${event.slug}` },
  }
}

function whenLines(startsAt: string, endsAt: string): string[] {
  if (sameDay(startsAt, endsAt)) {
    return [formatLongDate(startsAt), `${formatTime(startsAt)} to ${formatTime(endsAt)}`]
  }
  return [
    `${formatLongDate(startsAt)}, ${formatTime(startsAt)}`,
    `to ${formatLongDate(endsAt)}, ${formatTime(endsAt)}`,
  ]
}

export default async function EventPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) notFound()

  const now = currentTime()
  const over = isOver(event.endsAt, now)
  const [settings, recap, taken] = await Promise.all([
    getPublicSiteSettings(),
    over ? getEventRecap(event.id) : Promise.resolve([]),
    event.rsvpEnabled && !over ? getRsvpTotal(event.id) : Promise.resolve(0),
  ])

  const remaining = event.capacity !== null ? Math.max(event.capacity - taken, 0) : null
  const rsvpOpen = event.rsvpEnabled && !over && !event.cancelled && remaining !== 0
  const rsvpFull = event.rsvpEnabled && !over && !event.cancelled && remaining === 0

  const url = `${siteUrl()}/events/${event.slug}`
  const calendarEvent: CalendarEvent = {
    slug: event.slug,
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    venue: event.venue,
    summary: event.summary,
    theme: event.theme,
    cancelled: event.cancelled,
    updatedAt: event.updatedAt,
  }
  // Fail loudly in development if the calendar file ever stops building.
  buildIcs(calendarEvent, url)

  const structuredData = eventJsonLd({
    name: event.title,
    url,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    venue: event.venue,
    summary: event.summary,
    imageUrl: event.cover ? `${siteUrl()}${event.cover.url}` : `${siteUrl()}/brand/og-default.png`,
    cancelled: event.cancelled,
    orgName: settings.orgName,
    orgUrl: siteUrl(),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />

      <PageHero
        eyebrow={event.cancelled ? 'Cancelled event' : over ? 'Past event' : 'Event'}
        title={event.title}
        lead={event.summary ?? undefined}
        breadcrumb={[{ label: 'Events', href: '/events' }, { label: event.title }]}
      />

      <Section aria-label="Event details">
        {event.cancelled && (
          <p
            role="status"
            className="mb-8 rounded-xl border border-destructive bg-white p-5 font-semibold text-destructive"
          >
            This event has been cancelled.
          </p>
        )}

        <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <Reveal className="space-y-10">
            {event.cover && (
              <Image
                src={event.cover.url}
                alt={event.cover.alt}
                width={event.cover.width}
                height={event.cover.height}
                sizes="(min-width: 1024px) 700px, 100vw"
                priority
                className="h-auto w-full rounded-xl"
              />
            )}

            {event.theme && (
              <blockquote className="border-l-4 border-accent pl-5">
                <p className="font-serif text-2xl font-bold text-primary">{event.theme}</p>
                <footer className="mt-1 text-sm text-ink">Theme</footer>
              </blockquote>
            )}

            {event.agenda.length > 0 && (
              <div>
                <h2 className="mb-6 font-serif text-3xl font-bold text-primary">Programme</h2>
                <AgendaTimeline agenda={event.agenda} />
              </div>
            )}
          </Reveal>

          <Reveal delay={0.1}>
            <aside
              aria-label="When and where"
              className="space-y-5 rounded-xl border border-border bg-sand p-6 lg:sticky lg:top-28"
            >
              <div className="flex gap-3">
                <CalendarDays aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent-ink" />
                <div>
                  <h2 className="font-serif text-lg font-bold text-primary">Date</h2>
                  <p className="text-ink">
                    {whenLines(event.startsAt, event.endsAt).map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent-ink" />
                <div>
                  <h2 className="font-serif text-lg font-bold text-primary">Time zone</h2>
                  <p className="text-ink">East Africa Time (Nairobi, UTC+3)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent-ink" />
                <div>
                  <h2 className="font-serif text-lg font-bold text-primary">Venue</h2>
                  <p className="text-ink">{event.venue}</p>
                </div>
              </div>

              {event.programs.length > 0 && (
                <div>
                  <h2 className="mb-2 font-serif text-lg font-bold text-primary">Programs</h2>
                  <ul className="flex flex-wrap gap-2">
                    {event.programs.map((program) => (
                      <li key={program.slug}>
                        <Link
                          href={`/programs/${program.slug}`}
                          className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-primary ring-1 ring-border hover:ring-primary-soft"
                        >
                          {program.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!event.cancelled && (
                <div>
                  <h2 className="mb-2 font-serif text-lg font-bold text-primary">
                    Add to calendar
                  </h2>
                  <AddToCalendar
                    icsHref={`/events/${event.slug}/calendar.ics`}
                    googleHref={googleCalendarUrl(calendarEvent, url)}
                  />
                </div>
              )}
            </aside>
          </Reveal>
        </div>
      </Section>

      {(rsvpOpen || rsvpFull) && (
        <Section tone="sand" aria-labelledby="rsvp-title">
          <Reveal className="max-w-2xl">
            <SectionHeading
              id="rsvp-title"
              eyebrow="Join us"
              title="Register to attend"
              intro={
                remaining !== null && rsvpOpen
                  ? `${remaining} ${remaining === 1 ? 'place is' : 'places are'} left.`
                  : undefined
              }
              className="mb-6"
            />
            {/* The form stays mounted when the last place is taken, so its confirmation is not lost. */}
            <RsvpForm slug={event.slug} remaining={remaining} />
          </Reveal>
        </Section>
      )}

      {!over && !event.cancelled && event.sponsorTiers.length > 0 && (
        <Section aria-labelledby="sponsor-title">
          <Reveal>
            <SectionHeading
              id="sponsor-title"
              eyebrow="Sponsorship"
              title="Sponsor this event"
              intro="Businesses and organizations can support this event at these levels."
              action={{ label: 'Partner with us', href: '/partner' }}
            />
            <SponsorTiers tiers={event.sponsorTiers} />
          </Reveal>
        </Section>
      )}

      {over && !event.cancelled && (
        <Section tone="sand" aria-labelledby="recap-title">
          <Reveal>
            <SectionHeading
              id="recap-title"
              eyebrow="Recap"
              title="Photos from the day"
              intro={recap.length === 0 ? 'Photos from this event will be added here.' : undefined}
            />
            {recap.length > 0 && <GalleryStrip images={recap} />}
            <Button asChild variant="outline" className="mt-8">
              <Link href={eventsUrl({ tab: 'upcoming' })}>See upcoming events</Link>
            </Button>
          </Reveal>
        </Section>
      )}
    </>
  )
}
