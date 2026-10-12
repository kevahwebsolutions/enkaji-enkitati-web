import { revalidatePath, revalidateTag } from 'next/cache.js'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { collectionTag, docTag, globalTag, pagePath } from '@/lib/cache-tags'

type Doc = { id?: number | string; slug?: string | null; _status?: string | null }

/** Program pages list related events, posts and albums, so those changes purge every program page. */
const PROGRAM_PAGES = '/programs/[slug]'
const EVENT_PAGES = '/events/[slug]'
const POST_PAGES = '/news/[slug]'

/** Public routes affected when a document in the collection changes. */
function collectionPaths(collection: string, doc: Doc): string[] {
  const slug = doc.slug ?? ''
  switch (collection) {
    case 'programs':
      return ['/', '/programs', `/programs/${slug}`, '/impact', '/sitemap.xml']
    case 'events':
      return ['/', '/events', `/events/${slug}`, PROGRAM_PAGES, '/sitemap.xml']
    case 'posts':
      return [
        '/',
        '/news',
        `/news/${slug}`,
        '/news/rss.xml',
        PROGRAM_PAGES,
        POST_PAGES,
        '/sitemap.xml',
      ]
    case 'albums':
      return ['/gallery', `/gallery/${slug}`, '/gallery/[slug]', PROGRAM_PAGES, EVENT_PAGES]
    case 'team':
      return ['/about/leadership']
    case 'partners':
      return ['/', '/partner']
    case 'documents':
      return ['/about/governance', '/impact', '/partner']
    case 'pages':
      return [pagePath(slug), '/sitemap.xml']
    case 'media':
      return ['/gallery']
    default:
      return []
  }
}

const globalPaths: Record<string, string[]> = {
  home: ['/'],
  about: ['/about'],
  impact: ['/impact'],
}

function purge(tags: string[], paths: string[], layout: boolean): void {
  // Outside a Next.js request (seed script, jobs runner) there is no cache to purge.
  try {
    for (const tag of tags) revalidateTag(tag, { expire: 0 })
    for (const path of paths) {
      // A dynamic route pattern needs its type so every matching page is purged.
      if (path.includes('[')) revalidatePath(path, 'page')
      else revalidatePath(path)
    }
    if (layout) revalidatePath('/', 'layout')
  } catch {
    return
  }
}

function purgeDoc(collection: string, doc: Doc): void {
  const tags = [collectionTag(collection)]
  if (doc.slug) tags.push(docTag(collection, doc.slug))
  if (doc.id !== undefined) tags.push(docTag(collection, doc.id))
  purge(tags, collectionPaths(collection, doc), false)
}

/** A document is public when its collection has no drafts, or its status is published. */
const isLive = (doc: Doc | undefined): doc is Doc =>
  Boolean(doc) &&
  (doc?._status === undefined || doc?._status === null || doc?._status === 'published')

export const revalidateAfterChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  collection,
  req: { context },
}) => {
  if (context.disableRevalidate) return doc
  if (isLive(doc)) purgeDoc(collection.slug, doc)
  // Slug changed, or the document was unpublished: purge the old routes too.
  if (isLive(previousDoc) && (previousDoc.slug !== doc.slug || !isLive(doc))) {
    purgeDoc(collection.slug, previousDoc)
  }
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({
  doc,
  collection,
  req: { context },
}) => {
  if (!context.disableRevalidate) purgeDoc(collection.slug, doc)
  return doc
}

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({
  doc,
  global,
  req: { context },
}) => {
  if (context.disableRevalidate) return doc
  const live = doc._status === undefined || doc._status === null || doc._status === 'published'
  if (!live) return doc
  // Site settings feed the header and footer on every page, so purge the whole layout.
  purge([globalTag(global.slug)], globalPaths[global.slug] ?? [], global.slug === 'site-settings')
  return doc
}
