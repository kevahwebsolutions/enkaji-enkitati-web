import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { collectionTag, docTag } from '@/lib/cache-tags'
import { imageOf, type ImageRef } from '@/lib/media'
import type { GalleryImage } from '@/lib/programs-data'
import type { Event } from '@/payload-types'

const HOUR = 3600

export type EventSummary = {
  id: number
  title: string
  slug: string
  startsAt: string
  endsAt: string
  venue: string
  theme: string | null
  summary: string | null
  programs: Array<{ title: string; slug: string }>
  cancelled: boolean
}

export type EventDetail = EventSummary & {
  agenda: Array<{ time: string | null; title: string; description: string | null }>
  sponsorTiers: Array<{ name: string; minimumKes: number; benefits: string | null }>
  rsvpEnabled: boolean
  capacity: number | null
  cover: ImageRef | null
  meta: { title: string | null; description: string | null }
  updatedAt: string
}

const toSummary = (doc: Event): EventSummary | null => {
  if (!doc.slug) return null
  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    startsAt: doc.startsAt,
    endsAt: doc.endsAt,
    venue: doc.venue,
    theme: doc.theme ?? null,
    summary: doc.summary ?? null,
    programs: (doc.programs ?? []).flatMap((program) =>
      typeof program === 'number' || !program.slug
        ? []
        : [{ title: program.title, slug: program.slug }],
    ),
    cancelled: doc.status === 'cancelled',
  }
}

/**
 * Every published event, cancelled ones included. The list page decides what is upcoming or past
 * from the end time at request time, so this data can be cached without going stale.
 */
export const getAllEvents = unstable_cache(
  async (): Promise<EventSummary[]> => {
    try {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'events',
        where: { _status: { equals: 'published' } },
        sort: 'startsAt',
        limit: 500,
        depth: 1,
        pagination: false,
      })
      return docs.flatMap((doc) => toSummary(doc) ?? [])
    } catch (error) {
      console.error('Could not load events', error)
      return []
    }
  },
  ['events-all'],
  { tags: [collectionTag('events'), collectionTag('programs')], revalidate: HOUR },
)

export const getEventSlugs = unstable_cache(
  async (): Promise<string[]> => (await getAllEvents()).map((event) => event.slug),
  ['event-slugs'],
  { tags: [collectionTag('events')], revalidate: HOUR },
)

/** One published event with everything the detail page needs, or null for an unknown slug. */
export function getEvent(slug: string): Promise<EventDetail | null> {
  return unstable_cache(
    async (): Promise<EventDetail | null> => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'events',
        where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
        limit: 1,
        depth: 2,
        pagination: false,
      })
      const doc = docs[0]
      const summary = doc ? toSummary(doc) : null
      if (!doc || !summary) return null
      return {
        ...summary,
        agenda: (doc.agenda ?? []).map((row) => ({
          time: row.time ?? null,
          title: row.title,
          description: row.description ?? null,
        })),
        sponsorTiers: (doc.sponsorTiers ?? []).map((tier) => ({
          name: tier.name,
          minimumKes: tier.minimumKes,
          benefits: tier.benefits ?? null,
        })),
        rsvpEnabled: Boolean(doc.rsvpEnabled),
        capacity: doc.capacity ?? null,
        cover: imageOf(doc.cover, 'hero'),
        meta: { title: doc.meta?.title ?? null, description: doc.meta?.description ?? null },
        updatedAt: doc.updatedAt,
      }
    },
    ['event', slug],
    {
      tags: [collectionTag('events'), docTag('events', slug), collectionTag('media')],
      revalidate: HOUR,
    },
  )()
}

/** Photos from albums linked to the event, for the recap on past events. */
export function getEventRecap(eventId: number): Promise<GalleryImage[]> {
  return unstable_cache(
    async (): Promise<GalleryImage[]> => {
      try {
        const payload = await getPayload({ config })
        const { docs } = await payload.find({
          collection: 'albums',
          where: { event: { equals: eventId } },
          limit: 10,
          depth: 2,
          pagination: false,
        })
        return docs
          .flatMap((album) =>
            (album.images ?? []).flatMap((row) => {
              const image = imageOf(row.image, 'card')
              return image ? [{ image, caption: row.caption ?? null, album: album.title }] : []
            }),
          )
          .slice(0, 12)
      } catch (error) {
        console.error('Could not load the event recap', error)
        return []
      }
    },
    ['event-recap', String(eventId)],
    { tags: [collectionTag('albums'), collectionTag('media')], revalidate: HOUR },
  )()
}
