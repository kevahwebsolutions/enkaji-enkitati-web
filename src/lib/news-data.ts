import 'server-only'

import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres/drizzle'
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'

import { collectionTag, docTag } from '@/lib/cache-tags'
import { getDb } from '@/lib/db'
import type { PostCard } from '@/lib/home-data'
import { isLexicalState, type LexicalState } from '@/lib/lexical'
import { imageOf, type ImageRef } from '@/lib/media'
import type { Category } from '@/lib/news-url'
import { readingMinutes } from '@/lib/reading-time'
import type { Post } from '@/payload-types'

const HOUR = 3600
export const POSTS_PER_PAGE = 9
const SEARCH_LIMIT = 500

const toCard = (doc: Post): PostCard => ({
  id: doc.id,
  title: doc.title,
  slug: doc.slug ?? '',
  excerpt: doc.excerpt,
  category: doc.category,
  publishedAt: doc.publishedAt ?? null,
  cover: imageOf(doc.cover),
})

export type NewsPage = { posts: PostCard[]; total: number; totalPages: number; page: number }

const published: Where = { _status: { equals: 'published' } }

/**
 * Turns what a visitor typed into a Postgres prefix query ("menstr hyg" becomes
 * "menstr:* & hyg:*"), so results appear while typing. Only letters and digits survive, which
 * also keeps the query safe to hand to to_tsquery.
 */
export function toPrefixQuery(input: string): string | null {
  const words = (input.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, 8)
  if (words.length === 0) return null
  return words.map((word) => `${word.slice(0, 40)}:*`).join(' & ')
}

/**
 * Full-text search over title (weight A), excerpt (B) and the text inside the rich-text body (C),
 * using Postgres to_tsvector and to_tsquery. Returns published post ids, best match first.
 */
export async function searchPostIds(input: string, category?: Category): Promise<number[]> {
  const query = toPrefixQuery(input)
  if (!query) return []
  const db = await getDb()
  const result = await db.execute(sql`
    SELECT p.id
    FROM posts p
    CROSS JOIN LATERAL (
      SELECT
        setweight(to_tsvector('english', coalesce(p.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(p.excerpt, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(
          (SELECT string_agg(t #>> '{}', ' ') FROM jsonb_path_query(p.body, 'strict $.**.text') AS t),
          ''
        )), 'C') AS vec
    ) doc
    WHERE p._status = 'published'
      AND doc.vec @@ to_tsquery('english', ${query})
      ${category ? sql`AND p.category::text = ${category}` : sql``}
    ORDER BY ts_rank_cd(doc.vec, to_tsquery('english', ${query})) DESC,
             p.published_at DESC NULLS LAST
    LIMIT ${SEARCH_LIMIT}
  `)
  return (result.rows as Array<{ id: number }>).map((row) => Number(row.id))
}

async function searchPage(
  q: string,
  category: Category | undefined,
  page: number,
): Promise<NewsPage> {
  const ids = await searchPostIds(q, category)
  const totalPages = Math.max(Math.ceil(ids.length / POSTS_PER_PAGE), 1)
  const current = Math.min(page, totalPages)
  const pageIds = ids.slice((current - 1) * POSTS_PER_PAGE, current * POSTS_PER_PAGE)
  if (pageIds.length === 0) return { posts: [], total: 0, totalPages: 1, page: 1 }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { and: [published, { id: { in: pageIds } }] },
    limit: POSTS_PER_PAGE,
    depth: 1,
    pagination: false,
  })
  // Payload does not keep the order of an "in" query, so restore the search ranking.
  const byId = new Map(docs.map((doc) => [doc.id, doc]))
  const posts = pageIds.flatMap((id) => {
    const doc = byId.get(id)
    return doc?.slug ? [toCard(doc)] : []
  })
  return { posts, total: ids.length, totalPages, page: current }
}

async function listPage(category: Category | undefined, page: number): Promise<NewsPage> {
  const payload = await getPayload({ config })
  const where: Where = category
    ? { and: [published, { category: { equals: category } }] }
    : published
  const load = (target: number) =>
    payload.find({
      collection: 'posts',
      where,
      sort: '-publishedAt',
      limit: POSTS_PER_PAGE,
      page: target,
      depth: 1,
    })
  let result = await load(page)
  // A page number past the end shows the last page instead of an empty one.
  if (result.docs.length === 0 && page > 1 && result.totalPages > 0) {
    result = await load(result.totalPages)
  }
  return {
    posts: result.docs.filter((doc) => doc.slug).map(toCard),
    total: result.totalDocs,
    totalPages: Math.max(result.totalPages, 1),
    page: result.page ?? 1,
  }
}

const cachedListPage = (category: Category | undefined, page: number) =>
  unstable_cache(() => listPage(category, page), ['news-list', category ?? 'all', String(page)], {
    tags: [collectionTag('posts'), collectionTag('media')],
    revalidate: HOUR,
  })()

/**
 * One page of the news list. Category and page come from the URL; with a search term the posts
 * are ranked by relevance (not cached, since searches are open-ended), otherwise newest first.
 */
export async function getNewsPage(options: {
  category?: Category
  q?: string
  page: number
}): Promise<NewsPage> {
  const q = options.q?.trim()
  try {
    return q
      ? await searchPage(q, options.category, options.page)
      : await cachedListPage(options.category, options.page)
  } catch (error) {
    console.error('Could not load news', error)
    return { posts: [], total: 0, totalPages: 1, page: 1 }
  }
}

export type PostDetail = {
  id: number
  title: string
  slug: string
  excerpt: string
  body: LexicalState | null
  category: string
  publishedAt: string | null
  updatedAt: string
  cover: ImageRef | null
  author: { name: string; role: string } | null
  programs: Array<{ id: number; title: string; slug: string }>
  readingMinutes: number
  meta: { title: string | null; description: string | null }
}

/** One published post, or null for an unknown slug. The author shows only with consent on file. */
export function getPost(slug: string): Promise<PostDetail | null> {
  return unstable_cache(
    async (): Promise<PostDetail | null> => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'posts',
        where: { and: [published, { slug: { equals: slug } }] },
        limit: 1,
        depth: 1,
        pagination: false,
      })
      const doc = docs[0]
      if (!doc?.slug) return null
      const author = typeof doc.author === 'object' && doc.author ? doc.author : null
      const body = isLexicalState(doc.body) ? doc.body : null
      return {
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        excerpt: doc.excerpt,
        body,
        category: doc.category,
        publishedAt: doc.publishedAt ?? null,
        updatedAt: doc.updatedAt,
        cover: imageOf(doc.cover, 'hero'),
        author: author?.consentOnFile ? { name: author.name, role: author.role } : null,
        programs: (doc.programs ?? []).flatMap((program) =>
          typeof program === 'number' || !program.slug
            ? []
            : [{ id: program.id, title: program.title, slug: program.slug }],
        ),
        readingMinutes: readingMinutes(body),
        meta: { title: doc.meta?.title ?? null, description: doc.meta?.description ?? null },
      }
    },
    ['post', slug],
    {
      tags: [
        collectionTag('posts'),
        docTag('posts', slug),
        collectionTag('media'),
        collectionTag('team'),
      ],
      revalidate: HOUR,
    },
  )()
}

export const getPostSlugs = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'posts',
        where: published,
        limit: 500,
        depth: 0,
        pagination: false,
        select: { slug: true },
      })
      return docs.flatMap((doc) => (doc.slug ? [doc.slug] : []))
    } catch (error) {
      console.error('Could not load post slugs', error)
      return []
    }
  },
  ['post-slugs'],
  { tags: [collectionTag('posts')], revalidate: HOUR },
)

/** Up to three posts that share a program with this one, falling back to the newest others. */
export function getRelatedPosts(postId: number, programIds: number[]): Promise<PostCard[]> {
  return unstable_cache(
    async (): Promise<PostCard[]> => {
      try {
        const payload = await getPayload({ config })
        const find = (extra: Where[]) =>
          payload.find({
            collection: 'posts',
            where: { and: [published, { id: { not_equals: postId } }, ...extra] },
            sort: '-publishedAt',
            limit: 3,
            depth: 1,
            pagination: false,
          })
        const related =
          programIds.length > 0 ? await find([{ programs: { in: programIds } }]) : { docs: [] }
        const docs = related.docs.length > 0 ? related.docs : (await find([])).docs
        return docs.filter((doc) => doc.slug).map(toCard)
      } catch (error) {
        console.error('Could not load related posts', error)
        return []
      }
    },
    ['related-posts', String(postId), programIds.join(',')],
    { tags: [collectionTag('posts'), collectionTag('media')], revalidate: HOUR },
  )()
}

export type RssPost = {
  title: string
  slug: string
  excerpt: string
  category: string
  publishedAt: string
  author: string | null
}

/** The 20 newest published posts for the RSS feed. */
export async function getRssPosts(): Promise<RssPost[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: published,
    sort: '-publishedAt',
    limit: 20,
    depth: 1,
    pagination: false,
  })
  return docs.flatMap((doc) => {
    if (!doc.slug) return []
    const author = typeof doc.author === 'object' && doc.author?.consentOnFile ? doc.author : null
    return [
      {
        title: doc.title,
        slug: doc.slug,
        excerpt: doc.excerpt,
        category: doc.category,
        publishedAt: doc.publishedAt ?? doc.createdAt,
        author: author?.name ?? null,
      },
    ]
  })
}
