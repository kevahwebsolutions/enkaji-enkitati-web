// @vitest-environment node
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { getNewsPage, searchPostIds, POSTS_PER_PAGE } = await import('@/lib/news-data')

const run = Date.now()
/** A word that exists nowhere else, so only these test posts can match it. */
const token = `zebrafish${run}`
let payload: Payload
const ids: number[] = []

const paragraph = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        textFormat: 0,
        children: [
          { type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' },
        ],
      },
    ],
  },
})

async function makePost(
  n: number,
  category: 'News' | 'Stories' | 'Press' | 'Reports',
  where: 'title' | 'body',
  status: 'published' | 'draft' = 'published',
): Promise<number> {
  const post = await payload.create({
    collection: 'posts',
    data: {
      title: where === 'title' ? `${token} headline ${n}` : `Plain headline ${n} ${run}`,
      slug: `news-search-${run}-${n}`,
      excerpt: 'A short excerpt about community work.',
      body: paragraph(
        where === 'body' ? `Deep in the text we mention ${token} once.` : 'Nothing special here.',
      ),
      category,
      publishedAt: new Date(Date.UTC(2026, 0, 1 + n)).toISOString(),
      _status: status,
    },
    draft: status === 'draft',
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
  ids.push(post.id)
  return post.id
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  // 11 published posts: 4 Press, 7 News. The first one has the token in its title, the rest in the body.
  await makePost(0, 'Press', 'title')
  for (let n = 1; n <= 10; n++) await makePost(n, n <= 3 ? 'Press' : 'News', 'body')
  // A draft with the token must never appear.
  await makePost(99, 'News', 'title', 'draft')
}, 120_000)

afterAll(async () => {
  for (const id of ids) {
    await payload.delete({
      collection: 'posts',
      id,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
  }
})

describe('news search', () => {
  it('finds published posts by words in the title or the rich-text body, never drafts', async () => {
    const found = await searchPostIds(token)
    expect(found).toHaveLength(11)
    expect(found).not.toContain(ids[ids.length - 1])
  })

  it('ranks a title match above body-only matches', async () => {
    const found = await searchPostIds(token)
    expect(found[0]).toBe(ids[0])
  })

  it('matches the start of a word while the visitor is still typing', async () => {
    expect(await searchPostIds(token.slice(0, 12))).toHaveLength(11)
  })

  it('stems words, so "headlines" finds "headline"', async () => {
    expect(await searchPostIds(`${token} headlines`)).toContain(ids[0])
  })

  it('finds nothing for unrelated or empty searches', async () => {
    expect(await searchPostIds(`nomatch${run}`)).toEqual([])
    expect(await searchPostIds('   ')).toEqual([])
  })

  it('narrows by category', async () => {
    expect(await searchPostIds(token, 'Press')).toHaveLength(4)
    expect(await searchPostIds(token, 'News')).toHaveLength(7)
    expect(await searchPostIds(token, 'Stories')).toHaveLength(0)
  })
})

describe('search, category and pagination together', () => {
  it('pages the ranked results nine at a time', async () => {
    const first = await getNewsPage({ q: token, page: 1 })
    expect(POSTS_PER_PAGE).toBe(9)
    expect(first.total).toBe(11)
    expect(first.totalPages).toBe(2)
    expect(first.page).toBe(1)
    expect(first.posts).toHaveLength(9)
    expect(first.posts[0].id).toBe(ids[0])

    const second = await getNewsPage({ q: token, page: 2 })
    expect(second.page).toBe(2)
    expect(second.posts).toHaveLength(2)

    const seen = new Set([...first.posts, ...second.posts].map((post) => post.id))
    expect(seen.size).toBe(11)
  })

  it('shows the last page when the page number is too high', async () => {
    const result = await getNewsPage({ q: token, page: 9 })
    expect(result.page).toBe(2)
    expect(result.posts).toHaveLength(2)
  })

  it('applies the category before paging', async () => {
    const press = await getNewsPage({ q: token, category: 'Press', page: 1 })
    expect(press.total).toBe(4)
    expect(press.totalPages).toBe(1)
    expect(press.posts.every((post) => post.category === 'Press')).toBe(true)

    const news = await getNewsPage({ q: token, category: 'News', page: 1 })
    expect(news.total).toBe(7)
    expect(news.posts).toHaveLength(7)
    expect(news.posts.every((post) => post.category === 'News')).toBe(true)
  })

  it('returns an empty page, not an error, when nothing matches', async () => {
    const result = await getNewsPage({ q: `nomatch${run}`, page: 1 })
    expect(result).toEqual({ posts: [], total: 0, totalPages: 1, page: 1 })
  })
})
