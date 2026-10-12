'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import { Dialog } from 'radix-ui'
import { useRef, useState, type KeyboardEvent, type TouchEvent } from 'react'

import type { GalleryPhoto } from '@/lib/gallery-data'

const SWIPE_DISTANCE = 50

const navButton =
  'inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 focus-visible:outline-accent'

/**
 * Masonry grid of lazy-loaded thumbnails that open in a lightbox. The lightbox is a Radix Dialog,
 * so focus is trapped inside it and returns to the photo you were on when it closes. Left and right
 * arrow keys move between photos, Escape closes, and on a touch screen you can swipe.
 */
export function PhotoGrid({ photos, albumTitle }: { photos: GalleryPhoto[]; albumTitle: string }) {
  const [index, setIndex] = useState<number | null>(null)
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  const lastIndex = useRef(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const count = photos.length
  const open = index !== null

  const show = (target: number) => {
    const wrapped = (target + count) % count
    lastIndex.current = wrapped
    setIndex(wrapped)
  }
  const step = (delta: number) => {
    if (index !== null) show(index + delta)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      step(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      step(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      show(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      show(count - 1)
    }
  }

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    // A swipe is mostly sideways and long enough to be deliberate.
    if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1)
  }

  const current = index !== null ? photos[index] : null
  const neighbours =
    index !== null && count > 1
      ? [photos[(index + 1) % count], photos[(index - 1 + count) % count]]
      : []

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((photo, i) => (
          <li key={photo.id} className="mb-4 break-inside-avoid">
            <button
              type="button"
              ref={(element) => {
                buttons.current[i] = element
              }}
              onClick={() => show(i)}
              aria-label={`Open photo ${i + 1} of ${count}: ${photo.caption ?? photo.thumb.alt}`}
              className="block w-full overflow-hidden rounded-xl"
            >
              <Image
                src={photo.thumb.url}
                alt={photo.thumb.alt}
                width={photo.thumb.width}
                height={photo.thumb.height}
                sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw"
                loading="lazy"
                className="h-auto w-full transition-transform duration-300 hover:scale-[1.02] motion-reduce:transition-none"
              />
            </button>
            {photo.caption && <p className="mt-2 text-sm text-ink">{photo.caption}</p>}
          </li>
        ))}
      </ul>

      <Dialog.Root open={open} onOpenChange={(next) => !next && setIndex(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/95 data-open:animate-in data-open:fade-in-0 motion-reduce:animate-none" />
          <Dialog.Content
            onKeyDown={onKeyDown}
            onCloseAutoFocus={(event) => {
              // Return focus to the thumbnail of the photo that was showing, not the one opened.
              event.preventDefault()
              const target = buttons.current[lastIndex.current]
              target?.focus()
              target?.scrollIntoView({ block: 'nearest' })
            }}
            className="fixed inset-0 z-50 flex flex-col outline-none"
          >
            <Dialog.Title className="sr-only">
              {albumTitle}, photo {(index ?? 0) + 1} of {count}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Use the left and right arrow keys to change photo. Press Escape to close.
            </Dialog.Description>

            <div className="flex items-center justify-between p-4 text-white">
              <p aria-hidden="true" className="font-semibold">
                {(index ?? 0) + 1} / {count}
              </p>
              <Dialog.Close
                className="inline-flex size-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
                aria-label="Close photo viewer"
              >
                <X aria-hidden="true" className="size-6" />
              </Dialog.Close>
            </div>

            <div
              className="flex min-h-0 flex-1 items-center justify-center gap-2 px-2 sm:px-6"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {count > 1 && (
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className={`${navButton} max-sm:hidden`}
                >
                  <ChevronLeft aria-hidden="true" className="size-6" />
                </button>
              )}
              {current && (
                <figure className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-3">
                  <Image
                    key={current.id}
                    src={current.full.url}
                    alt={current.full.alt}
                    width={current.full.width}
                    height={current.full.height}
                    sizes="100vw"
                    priority
                    className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
                  />
                  {current.caption && (
                    <figcaption className="max-w-prose text-center text-white">
                      {current.caption}
                    </figcaption>
                  )}
                </figure>
              )}
              {count > 1 && (
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className={`${navButton} max-sm:hidden`}
                >
                  <ChevronRight aria-hidden="true" className="size-6" />
                </button>
              )}
            </div>

            {count > 1 && (
              <div className="flex justify-center gap-4 p-4 sm:hidden">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className={navButton}
                >
                  <ChevronLeft aria-hidden="true" className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className={navButton}
                >
                  <ChevronRight aria-hidden="true" className="size-6" />
                </button>
              </div>
            )}

            {/* Fetch the neighbouring photos so arrowing through the album feels instant. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute size-px overflow-hidden opacity-0"
            >
              {neighbours.map((photo) => (
                <Image
                  key={photo.id}
                  src={photo.full.url}
                  alt=""
                  width={photo.full.width}
                  height={photo.full.height}
                  sizes="100vw"
                  loading="eager"
                />
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
