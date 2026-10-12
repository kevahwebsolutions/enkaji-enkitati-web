import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { collectionTag, docTag, globalTag } from '@/lib/cache-tags'
import { imageOf, type ImageRef } from '@/lib/media'
import { redactPersonalNumbers } from '@/lib/privacy'
import type { About, Page } from '@/payload-types'

const HOUR = 3600

async function safely<T>(label: string, fallback: T, load: () => Promise<T>): Promise<T> {
  try {
    return await load()
  } catch (error) {
    console.error(`Could not load ${label}`, error)
    return fallback
  }
}

/** The published About global, or null if it cannot be read. */
export const getAbout = unstable_cache(
  async (): Promise<About | null> =>
    safely('the about content', null, async () => {
      const payload = await getPayload({ config })
      return payload.findGlobal({ slug: 'about', depth: 0, draft: false })
    }),
  ['about-global'],
  { tags: [globalTag('about')], revalidate: HOUR },
)

export type Leader = {
  id: number
  name: string
  role: string
  bio: string | null
  photo: ImageRef | null
}

/**
 * Officials who have consent on file, in the order set in the CMS. The consent filter is applied
 * here because the local API does not apply collection access rules. The team collection has no
 * phone field and bios are redacted of number-like text, so no personal number can be shown.
 */
export const getLeaders = unstable_cache(
  async (): Promise<Leader[]> =>
    safely('the leadership team', [], async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'team',
        where: { consentOnFile: { equals: true } },
        sort: 'order',
        limit: 50,
        depth: 1,
        pagination: false,
      })
      return docs.map((doc) => ({
        id: doc.id,
        name: doc.name,
        role: doc.role,
        bio: doc.bio ? redactPersonalNumbers(doc.bio) : null,
        photo: imageOf(doc.photo, 'card'),
      }))
    }),
  ['leaders'],
  { tags: [collectionTag('team'), collectionTag('media')], revalidate: HOUR },
)

/** A published CMS page by slug (founder, governance, privacy and so on). */
export function getPage(slug: string): Promise<Page | null> {
  return unstable_cache(
    async (): Promise<Page | null> =>
      safely(`the "${slug}" page`, null, async () => {
        const payload = await getPayload({ config })
        const { docs } = await payload.find({
          collection: 'pages',
          where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
          limit: 1,
          depth: 1,
          pagination: false,
        })
        return docs[0] ?? null
      }),
    ['page', slug],
    {
      tags: [collectionTag('pages'), docTag('pages', slug), collectionTag('media')],
      revalidate: HOUR,
    },
  )()
}

export type DocumentItem = {
  id: number
  title: string
  type: string
  year: number | null
  url: string
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  profile: 'Organization profile',
  constitution: 'Constitution (redacted)',
  'annual-report': 'Annual report',
  other: 'Document',
}

export const documentTypeLabel = (type: string): string => DOCUMENT_TYPE_LABELS[type] ?? 'Document'

export const getDocuments = unstable_cache(
  async (): Promise<DocumentItem[]> =>
    safely('the documents', [], async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'documents',
        sort: '-year',
        limit: 50,
        depth: 0,
        pagination: false,
      })
      return docs.flatMap((doc) =>
        doc.url
          ? [{ id: doc.id, title: doc.title, type: doc.type, year: doc.year ?? null, url: doc.url }]
          : [],
      )
    }),
  ['documents'],
  { tags: [collectionTag('documents')], revalidate: HOUR },
)
