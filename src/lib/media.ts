import type { Media } from '@/payload-types'

export type ImageRef = { url: string; alt: string; width: number; height: number }

type SizeName = 'thumb' | 'card' | 'hero' | 'og'

/**
 * A populated media document as the image details a page needs. It picks the named WebP size when
 * it exists and always returns dimensions, so pages reserve space and avoid layout shift.
 */
export function imageOf(
  media: number | Media | null | undefined,
  size: SizeName = 'card',
): ImageRef | null {
  if (!media || typeof media === 'number') return null
  const resized = media.sizes?.[size]
  const url = resized?.url ?? media.url
  const width = resized?.width ?? media.width
  const height = resized?.height ?? media.height
  if (!url || !width || !height) return null
  return { url, alt: media.alt, width, height }
}
