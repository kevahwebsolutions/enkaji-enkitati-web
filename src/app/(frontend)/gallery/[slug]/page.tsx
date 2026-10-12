import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PhotoGrid } from '@/components/gallery/PhotoGrid'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import { getAlbum, getAlbumSlugs } from '@/lib/gallery-data'

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  return (await getAlbumSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const album = await getAlbum(slug)
  if (!album) return { title: 'Album not found' }
  return {
    title: album.title,
    description: `${album.photos.length} photos: ${album.title}.`,
    alternates: { canonical: `/gallery/${album.slug}` },
  }
}

export default async function AlbumPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const album = await getAlbum(slug)
  if (!album || album.photos.length === 0) notFound()

  return (
    <>
      <PageHero
        eyebrow="Album"
        title={album.title}
        lead={`${album.photos.length} ${album.photos.length === 1 ? 'photo' : 'photos'}`}
        breadcrumb={[{ label: 'Gallery', href: '/gallery' }, { label: album.title }]}
      >
        {(album.event || album.program) && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {album.event && (
              <li>
                <Link
                  href={`/events/${album.event.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-primary ring-1 ring-border hover:ring-primary-soft"
                >
                  Event: {album.event.title}
                </Link>
              </li>
            )}
            {album.program && (
              <li>
                <Link
                  href={`/programs/${album.program.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-primary ring-1 ring-border hover:ring-primary-soft"
                >
                  Program: {album.program.title}
                </Link>
              </li>
            )}
          </ul>
        )}
      </PageHero>

      <Section aria-label="Photos">
        <PhotoGrid photos={album.photos} albumTitle={album.title} />
        <Button asChild variant="outline" className="mt-10">
          <Link href="/gallery">All albums</Link>
        </Button>
      </Section>
    </>
  )
}
