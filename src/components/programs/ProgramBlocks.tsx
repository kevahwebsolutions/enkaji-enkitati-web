import { CheckCircle2, Flag } from 'lucide-react'
import Image from 'next/image'

import { Stagger, StaggerItem } from '@/components/motion'
import type { GalleryImage } from '@/lib/programs-data'

/** Check-marked list for "What we do". */
export function ActivityList({ items }: { items: string[] }) {
  return (
    <Stagger as="ul" className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <StaggerItem as="li" key={item}>
          <div className="flex h-full items-start gap-3 rounded-xl border border-border bg-white p-4">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary-soft" />
            <span className="text-ink">{item}</span>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  )
}

/** Project cards. These are planned projects, so the heading around them says "projects", not "results". */
export function ProjectList({ items }: { items: string[] }) {
  return (
    <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <StaggerItem as="li" key={item}>
          <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-white p-5">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-bead text-accent-ink">
              <Flag aria-hidden="true" className="size-5" />
            </span>
            <span className="font-serif text-lg leading-snug font-bold text-primary">{item}</span>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  )
}

/** Horizontal strip of photos from related albums. It scrolls sideways and is reachable by keyboard. */
export function GalleryStrip({ images }: { images: GalleryImage[] }) {
  return (
    <ul
      tabIndex={0}
      aria-label="Photos from this program"
      className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:-mx-0 sm:px-0"
    >
      {images.map((item, index) => (
        <li key={`${item.image.url}-${index}`} className="w-72 shrink-0 snap-start">
          <figure>
            <Image
              src={item.image.url}
              alt={item.image.alt}
              width={item.image.width}
              height={item.image.height}
              sizes="288px"
              className="aspect-[4/3] w-full rounded-xl object-cover"
            />
            {item.caption && (
              <figcaption className="mt-2 text-sm text-ink">{item.caption}</figcaption>
            )}
          </figure>
        </li>
      ))}
    </ul>
  )
}
