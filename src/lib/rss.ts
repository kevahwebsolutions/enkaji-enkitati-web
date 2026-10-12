export type RssItem = {
  title: string
  link: string
  description: string
  publishedAt: string
  category: string
  author: string | null
}

export type RssChannel = {
  title: string
  link: string
  description: string
  selfUrl: string
  language?: string
  items: RssItem[]
}

/** Escapes text for XML element content and attribute values. */
export function xmlEscape(text: string): string {
  return (
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      // Characters that are not allowed in XML 1.0 are dropped.
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  )
}

/** RFC 822 date in GMT, as RSS 2.0 requires, for example "Thu, 15 Oct 2026 06:00:00 GMT". */
export const rfc822 = (iso: string | Date): string => new Date(iso).toUTCString()

/**
 * RSS 2.0 feed with an Atom self link. Posts are identified by their permanent link, so a reader
 * never shows the same story twice.
 */
export function buildRss(channel: RssChannel): string {
  const newest = channel.items.reduce<string | null>(
    (latest, item) => (!latest || item.publishedAt > latest ? item.publishedAt : latest),
    null,
  )
  const items = channel.items
    .map((item) =>
      [
        '    <item>',
        `      <title>${xmlEscape(item.title)}</title>`,
        `      <link>${xmlEscape(item.link)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(item.link)}</guid>`,
        `      <pubDate>${rfc822(item.publishedAt)}</pubDate>`,
        `      <category>${xmlEscape(item.category)}</category>`,
        ...(item.author ? [`      <dc:creator>${xmlEscape(item.author)}</dc:creator>`] : []),
        `      <description>${xmlEscape(item.description)}</description>`,
        '    </item>',
      ].join('\n'),
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlEscape(channel.title)}</title>
    <link>${xmlEscape(channel.link)}</link>
    <description>${xmlEscape(channel.description)}</description>
    <language>${channel.language ?? 'en'}</language>
    <atom:link href="${xmlEscape(channel.selfUrl)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${rfc822(newest ?? new Date())}</lastBuildDate>
${items}
  </channel>
</rss>
`
}
