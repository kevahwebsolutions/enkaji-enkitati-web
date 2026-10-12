import { pagePath } from '@/lib/cache-tags'

const siteUrl = (): string => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/** Public route of a document, used by admin Preview and Live Preview. */
export function frontendPath(collection: string, slug: string | null | undefined): string {
  const key = slug ?? ''
  switch (collection) {
    case 'posts':
      return `/news/${key}`
    case 'events':
      return `/events/${key}`
    case 'programs':
      return `/programs/${key}`
    case 'pages':
      return pagePath(key)
    default:
      return '/'
  }
}

export function previewUrl(collection: string, slug: string | null | undefined): string {
  return `${siteUrl()}${frontendPath(collection, slug)}`
}
