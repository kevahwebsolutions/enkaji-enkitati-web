import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { collectionTag } from '@/lib/cache-tags'

export type NavProgram = { title: string; slug: string }

/**
 * Published programs for the header menu, in the order set in the CMS. If the database cannot be
 * reached (for example during a build without a database) the menu falls back to the Programs index.
 */
export const getNavPrograms = unstable_cache(
  async (): Promise<NavProgram[]> => {
    try {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'programs',
        where: { _status: { equals: 'published' } },
        sort: 'order',
        limit: 20,
        depth: 0,
        pagination: false,
        select: { title: true, slug: true },
      })
      return docs.flatMap((doc) => (doc.slug ? [{ title: doc.title, slug: doc.slug }] : []))
    } catch (error) {
      console.error('Could not load programs for the navigation', error)
      return []
    }
  },
  ['nav-programs'],
  { tags: [collectionTag('programs')], revalidate: 3600 },
)
