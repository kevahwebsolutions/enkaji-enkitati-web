import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { collectionTag, docTag } from '@/lib/cache-tags'
import { imageOf, type ImageRef } from '@/lib/media'
import type { Album } from '@/payload-types'

const HOUR = 3600

export type AlbumCard = {
  id: number
  title: string
  slug: string
  count: number
  cover: ImageRef | null
  event: { title: string; slug: string } | null
  program: { title: string; slug: string } | null
}

export type GalleryPhoto = {
  id: string
  /** Medium WebP for the grid. */
  thumb: ImageRef
  /** Large WebP for the lightbox. */
  full: ImageRef
  caption: string | null
}

export type AlbumDetail = Omit<AlbumCard, 'cover' | 'count'> & { photos: GalleryPhoto[] }

const photosOf = (album: Album): GalleryPhoto[] =>
  (album.images ?? []).flatMap((row, index) => {
    const thumb = imageOf(row.image, 'card')
    const full = imageOf(row.image, 'hero') ?? thumb
    return thumb && full
      ? [{ id: `${album.id}-${row.id ?? index}`, thumb, full, caption: row.caption ?? null }]
      : []
  })

const relation = (value: Album['event'] | Album['program']) =>
  value && typeof value === 'object' && value.slug ? { title: value.title, slug: value.slug } : null

const toCard = (album: Album): AlbumCard | null => {
  if (!album.slug) return null
  const photos = photosOf(album)
  return {
    id: album.id,
    title: album.title,
    slug: album.slug,
    count: photos.length,
    cover: photos[0]?.thumb ?? null,
    event: relation(album.event),
    program: relation(album.program),
  }
}

/** All albums that have at least one photo. Photos are checked for consent when the album is saved. */
export const getAlbums = unstable_cache(
  async (): Promise<AlbumCard[]> => {
    try {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'albums',
        sort: '-createdAt',
        limit: 100,
        depth: 2,
        pagination: false,
      })
      return docs.flatMap((album) => {
        const card = toCard(album)
        return card && card.count > 0 ? [card] : []
      })
    } catch (error) {
      console.error('Could not load albums', error)
      return []
    }
  },
  ['albums-list'],
  {
    tags: [
      collectionTag('albums'),
      collectionTag('media'),
      collectionTag('events'),
      collectionTag('programs'),
    ],
    revalidate: HOUR,
  },
)

export const getAlbumSlugs = unstable_cache(
  async (): Promise<string[]> => (await getAlbums()).map((album) => album.slug),
  ['album-slugs'],
  { tags: [collectionTag('albums')], revalidate: HOUR },
)

export function getAlbum(slug: string): Promise<AlbumDetail | null> {
  return unstable_cache(
    async (): Promise<AlbumDetail | null> => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'albums',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 2,
        pagination: false,
      })
      const album = docs[0]
      const card = album ? toCard(album) : null
      if (!album || !card) return null
      return {
        id: card.id,
        title: card.title,
        slug: card.slug,
        event: card.event,
        program: card.program,
        photos: photosOf(album),
      }
    },
    ['album', slug],
    {
      tags: [collectionTag('albums'), docTag('albums', slug), collectionTag('media')],
      revalidate: HOUR,
    },
  )()
}
