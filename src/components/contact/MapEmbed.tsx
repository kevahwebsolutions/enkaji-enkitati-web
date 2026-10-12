'use client'

import { MapPin } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

// Narok town: the bounding box frames the town and the marker sits on its centre.
const EMBED =
  'https://www.openstreetmap.org/export/embed.html?bbox=35.8367%2C-1.1033%2C35.8967%2C-1.0633&layer=mapnik&marker=-1.0833%2C35.8667'
const LARGER = 'https://www.openstreetmap.org/?mlat=-1.0833&mlon=35.8667#map=14/-1.0833/35.8667'

/** An OpenStreetMap embed that loads only after the visitor asks for it. */
export function MapEmbed() {
  const [shown, setShown] = useState(false)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-sand">
      {shown ? (
        <>
          <iframe
            title="Map of Narok town"
            src={EMBED}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="block h-80 w-full border-0"
          />
          <p className="px-4 py-3 text-sm text-ink">
            Map data from OpenStreetMap contributors.{' '}
            <a href={LARGER} target="_blank" rel="noopener noreferrer" className="underline">
              View a larger map<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </>
      ) : (
        <div className="flex h-80 flex-col items-center justify-center gap-4 p-6 text-center">
          <MapPin aria-hidden="true" className="size-10 text-accent-ink" />
          <p className="max-w-sm text-ink">
            The map comes from OpenStreetMap. It loads only when you ask, so nothing is sent to them
            before then.
          </p>
          <Button type="button" onClick={() => setShown(true)}>
            Show map
          </Button>
        </div>
      )}
    </div>
  )
}
