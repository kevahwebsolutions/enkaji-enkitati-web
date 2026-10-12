import { siteUrl } from '@/lib/event-time'
import { getEvent } from '@/lib/events-data'
import { buildIcs } from '@/lib/ics'

/** Calendar file for one event. Cancelled and unknown events have none. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event || event.cancelled) return new Response('Not found', { status: 404 })

  const body = buildIcs(
    {
      slug: event.slug,
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      venue: event.venue,
      summary: event.summary,
      theme: event.theme,
      cancelled: false,
      updatedAt: event.updatedAt,
    },
    `${siteUrl()}/events/${event.slug}`,
  )

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.slug}.ics"`,
      'Cache-Control': 'public, max-age=300',
    },
  })
}
