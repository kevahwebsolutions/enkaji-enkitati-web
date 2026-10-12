import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { DocumentItem } from '@/lib/about-data'
import { collectionTag, docTag, globalTag } from '@/lib/cache-tags'
import type { EventCard, PostCard, ProgramCard } from '@/lib/home-data'
import { isLexicalState, type LexicalState } from '@/lib/lexical'
import { imageOf, type ImageRef } from '@/lib/media'
import type { Event, Impact, Post, Program } from '@/payload-types'

const HOUR = 3600

async function safely<T>(label: string, fallback: T, load: () => Promise<T>): Promise<T> {
  try {
    return await load()
  } catch (error) {
    console.error(`Could not load ${label}`, error)
    return fallback
  }
}

/** Published programs in the order set in the CMS. */
export const getPrograms = unstable_cache(
  async (): Promise<ProgramCard[]> =>
    safely('programs', [], async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'programs',
        where: { _status: { equals: 'published' } },
        sort: 'order',
        limit: 50,
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
  ['programs-list'],
  { tags: [collectionTag('programs')], revalidate: HOUR },
)

export const getProgramSlugs = unstable_cache(
  async (): Promise<string[]> => (await getPrograms()).map((program) => program.slug),
  ['program-slugs'],
  { tags: [collectionTag('programs')], revalidate: HOUR },
)

export type ProgramDetail = {
  id: number
  title: string
  slug: string
  icon: string
  summary: string
  problem: string | null
  activities: string[]
  projects: string[]
  sdgs: string[]
  body: LexicalState | null
  meta: { title: string | null; description: string | null }
}

const items = (rows: Program['activities']): string[] =>
  (rows ?? []).map((row) => row.item).filter(Boolean)

/** One published program with all its content, or null when the slug is unknown. */
export function getProgram(slug: string): Promise<ProgramDetail | null> {
  return unstable_cache(
    async (): Promise<ProgramDetail | null> => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'programs',
        where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
        limit: 1,
        depth: 0,
        pagination: false,
      })
      const doc = docs[0]
      if (!doc?.slug) return null
      return {
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        icon: doc.icon,
        summary: doc.summary,
        problem: doc.problem ?? null,
        activities: items(doc.activities),
        projects: items(doc.projects),
        sdgs: doc.sdgs ?? [],
        body: isLexicalState(doc.body) ? doc.body : null,
        meta: { title: doc.meta?.title ?? null, description: doc.meta?.description ?? null },
      }
    },
    ['program', slug],
    { tags: [collectionTag('programs'), docTag('programs', slug)], revalidate: HOUR },
  )()
}

const toEventCard = (doc: Event): EventCard => ({
  id: doc.id,
  title: doc.title,
  slug: doc.slug ?? '',
  startsAt: doc.startsAt,
  endsAt: doc.endsAt,
  venue: doc.venue,
  summary: doc.summary ?? null,
})

/** Events linked to the program, split into upcoming (still to finish) and past. Cancelled ones are left out. */
export function getProgramEvents(
  programId: number,
): Promise<{ upcoming: EventCard[]; past: EventCard[] }> {
  return unstable_cache(
    async () =>
      safely('program events', { upcoming: [], past: [] }, async () => {
        const payload = await getPayload({ config })
        const { docs } = await payload.find({
          collection: 'events',
          where: {
            and: [
              { _status: { equals: 'published' } },
              { programs: { equals: programId } },
              { status: { not_equals: 'cancelled' } },
            ],
          },
          sort: 'startsAt',
          limit: 50,
          depth: 0,
          pagination: false,
        })
        const now = Date.now()
        const cards = docs.filter((doc) => doc.slug).map(toEventCard)
        return {
          upcoming: cards.filter((card) => new Date(card.endsAt).getTime() >= now).slice(0, 3),
          past: cards
            .filter((card) => new Date(card.endsAt).getTime() < now)
            .reverse()
            .slice(0, 3),
        }
      }),
    ['program-events', String(programId)],
    { tags: [collectionTag('events')], revalidate: HOUR },
  )()
}

const toPostCard = (doc: Post): PostCard => ({
  id: doc.id,
  title: doc.title,
  slug: doc.slug ?? '',
  excerpt: doc.excerpt,
  category: doc.category,
  publishedAt: doc.publishedAt ?? null,
  cover: imageOf(doc.cover),
})

export function getProgramPosts(programId: number): Promise<PostCard[]> {
  return unstable_cache(
    async () =>
      safely('program posts', [], async () => {
        const payload = await getPayload({ config })
        const { docs } = await payload.find({
          collection: 'posts',
          where: {
            and: [{ _status: { equals: 'published' } }, { programs: { equals: programId } }],
          },
          sort: '-publishedAt',
          limit: 3,
          depth: 1,
          pagination: false,
        })
        return docs.filter((doc) => doc.slug).map(toPostCard)
      }),
    ['program-posts', String(programId)],
    { tags: [collectionTag('posts'), collectionTag('media')], revalidate: HOUR },
  )()
}

export type GalleryImage = { image: ImageRef; caption: string | null; album: string }

/** Images from albums linked to the program, for the gallery strip. */
export function getProgramGallery(programId: number): Promise<GalleryImage[]> {
  return unstable_cache(
    async () =>
      safely('program gallery', [], async () => {
        const payload = await getPayload({ config })
        const { docs } = await payload.find({
          collection: 'albums',
          where: { program: { equals: programId } },
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
          .slice(0, 8)
      }),
    ['program-gallery', String(programId)],
    { tags: [collectionTag('albums'), collectionTag('media')], revalidate: HOUR },
  )()
}

export type ImpactContent = {
  intro: LexicalState | null
  sdgAlignment: Array<{ sdg: string; activities: string }>
  targetsLabel: string
  targets: Array<{ title: string; description: string | null }>
  annualPlan: Array<{ objective: string; amountKes: number }>
  annualReports: DocumentItem[]
}

const fallbackImpact: ImpactContent = {
  intro: null,
  sdgAlignment: [],
  targetsLabel: '2026–2030 targets',
  targets: [],
  annualPlan: [],
  annualReports: [],
}

export const getImpact = unstable_cache(
  async (): Promise<ImpactContent> =>
    safely('the impact content', fallbackImpact, async () => {
      const payload = await getPayload({ config })
      const impact: Impact = await payload.findGlobal({ slug: 'impact', depth: 1 })
      return {
        intro: isLexicalState(impact.intro) ? impact.intro : null,
        sdgAlignment: (impact.sdgAlignment ?? []).map((row) => ({
          sdg: row.sdg,
          activities: row.activities,
        })),
        targetsLabel: impact.targetsLabel || fallbackImpact.targetsLabel,
        targets: (impact.targets ?? []).map((row) => ({
          title: row.title,
          description: row.description ?? null,
        })),
        annualPlan: (impact.annualPlan ?? []).map((row) => ({
          objective: row.objective,
          amountKes: row.amountKes,
        })),
        annualReports: (impact.annualReports ?? []).flatMap((doc) =>
          typeof doc === 'number' || !doc.url
            ? []
            : [
                {
                  id: doc.id,
                  title: doc.title,
                  type: doc.type,
                  year: doc.year ?? null,
                  url: doc.url,
                },
              ],
        ),
      }
    }),
  ['impact-global'],
  { tags: [globalTag('impact'), collectionTag('documents')], revalidate: HOUR },
)
