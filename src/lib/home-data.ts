import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import advocacyCalendar from '../../enkaji-content/content/advocacy-calendar.json'
import { collectionTag, globalTag } from '@/lib/cache-tags'
import { HOME_DEFAULTS } from '@/lib/home-defaults'
import { imageOf, type ImageRef } from '@/lib/media'

const HOUR = 3600

export type HomeContent = {
  eyebrow: string
  headline: string
  lead: string
  donateLabel: string
  partnerLabel: string
  whereHeading: string
  whereText: string
  aboutText: string
  vision: string | null
  sdgStrip: string[]
}

export type ProgramCard = {
  id: number
  title: string
  slug: string
  icon: string
  summary: string
  sdgs: string[]
}

export type EventCard = {
  id: number
  title: string
  slug: string
  startsAt: string
  endsAt: string
  venue: string
  summary: string | null
}

export type { ImageRef }

export type PostCard = {
  id: number
  title: string
  slug: string
  excerpt: string
  category: string
  publishedAt: string | null
  cover: ImageRef | null
}

export type PartnerLogo = { id: number; name: string; url: string | null; logo: ImageRef }

export type CalendarDate = { date: string; name: string; activity: string }

async function safely<T>(label: string, fallback: T, load: () => Promise<T>): Promise<T> {
  try {
    return await load()
  } catch (error) {
    console.error(`Could not load ${label} for the home page`, error)
    return fallback
  }
}

const fallbackContent: HomeContent = {
  eyebrow: HOME_DEFAULTS.eyebrow,
  headline: HOME_DEFAULTS.headline,
  lead: HOME_DEFAULTS.lead,
  donateLabel: HOME_DEFAULTS.donateLabel,
  partnerLabel: HOME_DEFAULTS.partnerLabel,
  whereHeading: HOME_DEFAULTS.whereHeading,
  whereText: HOME_DEFAULTS.whereText,
  aboutText: HOME_DEFAULTS.aboutText,
  vision: null,
  sdgStrip: [...HOME_DEFAULTS.sdgStrip],
}

/** Text from the home and about globals, with the defaults filling any gaps. */
export const getHomeContent = unstable_cache(
  async (): Promise<HomeContent> =>
    safely('the home content', fallbackContent, async () => {
      const payload = await getPayload({ config })
      const [home, about] = await Promise.all([
        payload.findGlobal({ slug: 'home', depth: 0, draft: false }),
        payload.findGlobal({ slug: 'about', depth: 0, draft: false }),
      ])
      return {
        eyebrow: home.hero?.eyebrow || HOME_DEFAULTS.eyebrow,
        headline: home.hero?.headline || HOME_DEFAULTS.headline,
        lead: home.hero?.subheadline || HOME_DEFAULTS.lead,
        donateLabel: home.hero?.donateLabel || HOME_DEFAULTS.donateLabel,
        partnerLabel: home.hero?.partnerLabel || HOME_DEFAULTS.partnerLabel,
        whereHeading: home.whereWeWork?.heading || HOME_DEFAULTS.whereHeading,
        whereText: home.whereWeWork?.text || HOME_DEFAULTS.whereText,
        aboutText: about.mission || HOME_DEFAULTS.aboutText,
        vision: about.vision || null,
        sdgStrip: home.sdgStrip?.length ? home.sdgStrip : [...HOME_DEFAULTS.sdgStrip],
      }
    }),
  ['home-content'],
  { tags: [globalTag('home'), globalTag('about')], revalidate: HOUR },
)

export const getHomePrograms = unstable_cache(
  async (): Promise<ProgramCard[]> =>
    safely('programs', [], async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'programs',
        where: { _status: { equals: 'published' } },
        sort: 'order',
        limit: 5,
        depth: 0,
        pagination: false,
        select: { title: true, slug: true, icon: true, summary: true, sdgs: true },
      })
      return docs.flatMap((doc) =>
        doc.slug
          ? [
              {
                id: doc.id,
                title: doc.title,
                slug: doc.slug,
                icon: doc.icon,
                summary: doc.summary,
                sdgs: doc.sdgs ?? [],
              },
            ]
          : [],
      )
    }),
  ['home-programs'],
  { tags: [collectionTag('programs')], revalidate: HOUR },
)

/** The next three published events that have not finished. The page revalidates hourly so the list moves on as dates pass. */
export const getUpcomingEvents = unstable_cache(
  async (): Promise<EventCard[]> =>
    safely('events', [], async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'events',
        where: {
          and: [
            { _status: { equals: 'published' } },
            { status: { not_equals: 'cancelled' } },
            { endsAt: { greater_than_equal: new Date().toISOString() } },
          ],
        },
        sort: 'startsAt',
        limit: 3,
        depth: 0,
        pagination: false,
        select: {
          title: true,
          slug: true,
          startsAt: true,
          endsAt: true,
          venue: true,
          summary: true,
        },
      })
      return docs.flatMap((doc) =>
        doc.slug
          ? [
              {
                id: doc.id,
                title: doc.title,
                slug: doc.slug,
                startsAt: doc.startsAt,
                endsAt: doc.endsAt,
                venue: doc.venue,
                summary: doc.summary ?? null,
              },
            ]
          : [],
      )
    }),
  ['home-events'],
  { tags: [collectionTag('events')], revalidate: HOUR },
)

export const getLatestPosts = unstable_cache(
  async (): Promise<PostCard[]> =>
    safely('posts', [], async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'posts',
        where: { _status: { equals: 'published' } },
        sort: '-publishedAt',
        limit: 3,
        depth: 1,
        pagination: false,
        select: {
          title: true,
          slug: true,
          excerpt: true,
          category: true,
          publishedAt: true,
          cover: true,
        },
      })
      return docs.flatMap((doc) =>
        doc.slug
          ? [
              {
                id: doc.id,
                title: doc.title,
                slug: doc.slug,
                excerpt: doc.excerpt,
                category: doc.category,
                publishedAt: doc.publishedAt ?? null,
                cover: imageOf(doc.cover),
              },
            ]
          : [],
      )
    }),
  ['home-posts'],
  { tags: [collectionTag('posts'), collectionTag('media')], revalidate: HOUR },
)

export const getPartnerLogos = unstable_cache(
  async (): Promise<PartnerLogo[]> =>
    safely('partners', [], async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'partners',
        sort: 'order',
        limit: 12,
        depth: 1,
        pagination: false,
      })
      return docs.flatMap((doc) => {
        const logo = imageOf(doc.logo)
        return logo ? [{ id: doc.id, name: doc.name, url: doc.url ?? null, logo }] : []
      })
    }),
  ['home-partners'],
  { tags: [collectionTag('partners'), collectionTag('media')], revalidate: HOUR },
)

/** The next three advocacy days from the CBO calendar, used when no events are scheduled. */
export function getNextCalendarDates(from: Date = new Date(), count = 3): CalendarDate[] {
  const year = from.getUTCFullYear()
  const today = Date.UTC(year, from.getUTCMonth(), from.getUTCDate())
  return advocacyCalendar
    .map((entry) => {
      const [month, day] = entry.date.split('-').map(Number)
      let when = Date.UTC(year, month - 1, day)
      if (when < today) when = Date.UTC(year + 1, month - 1, day)
      return { when, name: entry.name, activity: entry.suggestedActivity }
    })
    .sort((a, b) => a.when - b.when)
    .slice(0, count)
    .map((entry) => ({
      date: new Date(entry.when).toISOString(),
      name: entry.name,
      activity: entry.activity,
    }))
}
