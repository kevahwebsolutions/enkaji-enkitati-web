// @vitest-environment node
import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { describe, expect, it, vi } from 'vitest'

import { articleJsonLd } from '@/lib/jsonld'
import type { LexicalState } from '@/lib/lexical'
import { newsUrl } from '@/lib/news-url'
import { readingMinutes } from '@/lib/reading-time'
import { buildRss, rfc822, xmlEscape } from '@/lib/rss'
import { shareTargets } from '@/lib/share'

vi.mock('server-only', () => ({}))

const { toPrefixQuery } = await import('@/lib/news-data')

const feed = buildRss({
  title: 'Enkaji Enkitati CBO news & stories',
  link: 'https://enkajienkitaticbo.org/news',
  description: 'Empowering Women, Sustaining Futures',
  selfUrl: 'https://enkajienkitaticbo.org/news/rss.xml',
  items: [
    {
      title: 'Girls & boys: "A pad can keep a girl in school"',
      link: 'https://enkajienkitaticbo.org/news/a-pad-can-keep-a-girl-in-school',
      description: 'Periods are natural <not shameful>. It’s a human right.',
      publishedAt: '2026-05-30T06:00:00.000Z',
      category: 'Stories',
      author: 'Caren Naeku Dapash',
    },
    {
      title: 'Welcome to Enkaji Enkitati CBO',
      link: 'https://enkajienkitaticbo.org/news/welcome',
      description: 'We are established.',
      publishedAt: '2026-07-06T06:00:00.000Z',
      category: 'News',
      author: null,
    },
  ],
})

type Parsed = {
  rss: {
    '@_version': string
    channel: {
      title: string
      link: string
      description: string
      language: string
      lastBuildDate: string
      'atom:link': { '@_href': string; '@_rel': string; '@_type': string }
      item: Array<{
        title: string
        link: string
        guid: { '#text': string; '@_isPermaLink': string }
        pubDate: string
        category: string
        description: string
        'dc:creator'?: string
      }>
    }
  }
}

describe('RSS feed', () => {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const parsed = parser.parse(feed) as Parsed
  const channel = parsed.rss.channel

  it('is well-formed XML with the declaration first', () => {
    expect(feed.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(XMLValidator.validate(feed)).toBe(true)
  })

  it('is RSS 2.0 with the required channel elements', () => {
    expect(parsed.rss['@_version']).toBe('2.0')
    expect(channel.title).toBe('Enkaji Enkitati CBO news & stories')
    expect(channel.link).toBe('https://enkajienkitaticbo.org/news')
    expect(channel.description).toBe('Empowering Women, Sustaining Futures')
    expect(channel.language).toBe('en')
  })

  it('declares its own address with an Atom self link', () => {
    expect(channel['atom:link']['@_rel']).toBe('self')
    expect(channel['atom:link']['@_type']).toBe('application/rss+xml')
    expect(channel['atom:link']['@_href']).toBe('https://enkajienkitaticbo.org/news/rss.xml')
  })

  it('writes every date as RFC 822 in GMT', () => {
    const rfc = /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/
    expect(channel.lastBuildDate).toMatch(rfc)
    for (const item of channel.item) expect(item.pubDate).toMatch(rfc)
    expect(rfc822('2026-10-15T06:00:00.000Z')).toBe('Thu, 15 Oct 2026 06:00:00 GMT')
  })

  it('uses the newest post date as the last build date', () => {
    expect(channel.lastBuildDate).toBe('Mon, 06 Jul 2026 06:00:00 GMT')
  })

  it('gives each item a title, a permanent link, a guid and a description', () => {
    expect(channel.item).toHaveLength(2)
    for (const item of channel.item) {
      expect(item.title).toBeTruthy()
      expect(item.link).toMatch(/^https:\/\/enkajienkitaticbo\.org\/news\//)
      expect(item.guid['#text']).toBe(item.link)
      expect(item.guid['@_isPermaLink']).toBe('true')
      expect(item.description).toBeTruthy()
    }
  })

  it('escapes markup in titles and descriptions and round-trips the text', () => {
    expect(channel.item[0].title).toBe('Girls & boys: "A pad can keep a girl in school"')
    expect(channel.item[0].description).toBe(
      'Periods are natural <not shameful>. It’s a human right.',
    )
    expect(feed).not.toContain('<not shameful>')
  })

  it('names an author only when one is shown', () => {
    expect(channel.item[0]['dc:creator']).toBe('Caren Naeku Dapash')
    expect(channel.item[1]['dc:creator']).toBeUndefined()
  })

  it('removes characters that XML 1.0 forbids', () => {
    expect(xmlEscape('a\u0000b\u0008c\u000Bd')).toBe('abcd')
  })
})

describe('search query', () => {
  it('turns words into a prefix query', () => {
    expect(toPrefixQuery('Menstrual hygiene')).toBe('menstrual:* & hygiene:*')
  })

  it('keeps only letters and digits, so operators and quotes cannot reach the database', () => {
    expect(toPrefixQuery(`girls' & (boys) | !x:* ; DROP TABLE posts`)).toBe(
      'girls:* & boys:* & x:* & drop:* & table:* & posts:*',
    )
  })

  it('returns null when there is nothing to search for', () => {
    expect(toPrefixQuery('')).toBeNull()
    expect(toPrefixQuery('  !!! ')).toBeNull()
  })

  it('limits the number and the length of words', () => {
    const query = toPrefixQuery(`${'a'.repeat(100)} 1 2 3 4 5 6 7 8 9 10`)!
    expect(query.split(' & ')).toHaveLength(8)
    expect(query.split(' & ')[0]).toBe(`${'a'.repeat(40)}:*`)
  })
})

describe('news links', () => {
  it('leaves out defaults and combines category, search and page', () => {
    expect(newsUrl()).toBe('/news')
    expect(newsUrl({ page: 1 })).toBe('/news')
    expect(newsUrl({ category: 'Stories' })).toBe('/news?category=Stories')
    expect(newsUrl({ category: 'Press', q: 'water supply', page: 3 })).toBe(
      '/news?category=Press&q=water+supply&page=3',
    )
    expect(newsUrl({ q: '   ' })).toBe('/news')
  })
})

describe('reading time', () => {
  const state = (words: number): LexicalState => ({
    root: {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', text: 'word '.repeat(words) }] }],
    },
  })

  it('is at least one minute and rounds up at 200 words a minute', () => {
    expect(readingMinutes(null)).toBe(1)
    expect(readingMinutes(state(5))).toBe(1)
    expect(readingMinutes(state(200))).toBe(1)
    expect(readingMinutes(state(201))).toBe(2)
    expect(readingMinutes(state(1000))).toBe(5)
  })
})

describe('share links', () => {
  const targets = shareTargets('https://x.test/news/a b', 'Hello & welcome')
  const byKey = Object.fromEntries(targets.map((t) => [t.key, new URL(t.href)]))

  it('covers WhatsApp, Facebook, X and LinkedIn with the page address encoded', () => {
    expect(targets.map((t) => t.key)).toEqual(['whatsapp', 'facebook', 'x', 'linkedin'])
    expect(byKey.whatsapp.host).toBe('wa.me')
    expect(byKey.whatsapp.searchParams.get('text')).toBe('Hello & welcome https://x.test/news/a b')
    expect(byKey.facebook.searchParams.get('u')).toBe('https://x.test/news/a b')
    expect(byKey.x.searchParams.get('url')).toBe('https://x.test/news/a b')
    expect(byKey.linkedin.searchParams.get('url')).toBe('https://x.test/news/a b')
  })

  it('are plain https links, never scripts', () => {
    for (const target of targets) expect(target.href.startsWith('https://')).toBe(true)
  })
})

describe('Article structured data', () => {
  const base = {
    headline: 'Title',
    url: 'https://x.test/news/title',
    description: 'Excerpt',
    publishedAt: '2026-07-06T09:00:00+03:00',
    modifiedAt: '2026-07-07T09:00:00.000Z',
    imageUrl: 'https://x.test/cover.webp',
    orgName: 'Enkaji Enkitati CBO',
    orgUrl: 'https://x.test',
    logoUrl: 'https://x.test/logo.png',
  }

  it('credits the organization when no author is shown', () => {
    const data = articleJsonLd({ ...base, authorName: null })
    expect(data['@type']).toBe('Article')
    expect((data.author as { '@type': string })['@type']).toBe('Organization')
    expect(data.datePublished).toBe('2026-07-06T09:00:00+03:00')
  })

  it('credits a person when the author is shown', () => {
    const data = articleJsonLd({ ...base, authorName: 'Caren Naeku Dapash' })
    expect(data.author).toEqual({ '@type': 'Person', name: 'Caren Naeku Dapash' })
  })
})
