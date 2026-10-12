import { siteUrl } from '@/lib/event-time'
import { getRssPosts } from '@/lib/news-data'
import { buildRss } from '@/lib/rss'
import { getPublicSiteSettings } from '@/lib/site-settings'

/** RSS 2.0 feed of the 20 newest published posts (FR-NEWS-04). */
export async function GET(): Promise<Response> {
  const [posts, settings] = await Promise.all([getRssPosts(), getPublicSiteSettings()])
  const base = siteUrl()

  const xml = buildRss({
    title: `${settings.orgName} news and stories`,
    link: `${base}/news`,
    description: settings.tagline,
    selfUrl: `${base}/news/rss.xml`,
    items: posts.map((post) => ({
      title: post.title,
      link: `${base}/news/${post.slug}`,
      description: post.excerpt,
      publishedAt: post.publishedAt,
      category: post.category,
      author: post.author,
    })),
  })

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  })
}
