import { MapPin } from 'lucide-react'

import { narokMarker, narokOutline, narokViewBox } from './narok-map.generated'

/**
 * Static SVG outline of Narok County (geoBoundaries, public domain) with a marker for Narok Town,
 * in Ewaso Ng'iro. No map library or tiles, so it adds no JavaScript to the page.
 */
export function NarokMap() {
  return (
    <figure className="mx-auto w-full max-w-md">
      <svg
        viewBox={narokViewBox}
        role="img"
        aria-labelledby="narok-map-title narok-map-desc"
        className="h-auto w-full"
      >
        <title id="narok-map-title">Map of Narok County, Kenya</title>
        <desc id="narok-map-desc">
          Outline of Narok County with a marker at Narok Town, in Ewaso Ng&apos;iro, in the north of
          the county.
        </desc>
        <path
          d={narokOutline}
          className="fill-bead stroke-primary"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <g transform={`translate(${narokMarker.x} ${narokMarker.y})`}>
          <circle r="18" className="fill-accent/30" />
          <circle r="8" className="fill-primary stroke-sand" strokeWidth="2.5" />
        </g>
      </svg>
      <figcaption className="mt-3 flex items-center gap-2 text-sm text-ink">
        <MapPin aria-hidden="true" className="size-4 shrink-0 text-accent-ink" />
        Ewaso Ng&apos;iro, Narok Town Ward. Outline from public-domain county boundaries.
      </figcaption>
    </figure>
  )
}
