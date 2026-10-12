import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { HoverLift, Reveal, Stagger, StaggerItem } from '@/components/motion'
import { getAlbums } from '@/lib/gallery-data'

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Photo albums from Enkaji Enkitati CBO events and programs in Ewaso Ng’iro, Narok County.',
  alternates: { canonical: '/gallery' },
}

export default async function GalleryPage() {
  const albums = await getAlbums()

  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="Our work in pictures"
        lead="Albums from our events and programs."
        breadcrumb={[{ label: 'Gallery' }]}
      />

      <Section aria-label="Albums">
        {albums.length > 0 ? (
          <Stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <StaggerItem as="li" key={album.id}>
                <HoverLift className="h-full rounded-xl">
                  <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white">
                    {album.cover && (
                      <Image
                        src={album.cover.url}
                        alt={album.cover.alt}
                        width={album.cover.width}
                        height={album.cover.height}
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw"
                        className="h-auto w-full"
                      />
                    )}
                    <div className="flex flex-1 flex-col gap-1 p-5">
                      <h2 className="font-serif text-xl font-bold text-primary">
                        <Link
                          href={`/gallery/${album.slug}`}
                          className="after:absolute after:inset-0 after:rounded-xl"
                        >
                          {album.title}
                        </Link>
                      </h2>
                      <p className="text-ink">
                        {album.count} {album.count === 1 ? 'photo' : 'photos'}
                        {album.event
                          ? `, ${album.event.title}`
                          : album.program
                            ? `, ${album.program.title}`
                            : ''}
                      </p>
                    </div>
                  </article>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <Reveal className="max-w-2xl">
            <p className="text-lg text-ink">
              Photo albums will appear here after our next event. Photos are shown only when the
              people in them, or their guardians, have agreed.
            </p>
          </Reveal>
        )}
      </Section>
    </>
  )
}
