import { useId } from 'react'

import { cn } from '@/lib/utils'

type BeadBandProps = {
  className?: string
  /** Band height in pixels. The diamond tile scales with it. */
  height?: number
}

/** Repeating bead-diamond divider taken from the logo band. Decorative only. */
export function BeadBand({ className, height = 20 }: BeadBandProps) {
  const patternId = `bead-${useId().replace(/:/g, '')}`
  const mid = height / 2

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cn('block w-full', className)}
      height={height}
      width="100%"
    >
      <defs>
        <pattern id={patternId} width={height} height={height} patternUnits="userSpaceOnUse">
          <rect width={height} height={height} className="fill-sand" />
          <path
            d={`M${mid} 1 L${height - 1} ${mid} L${mid} ${height - 1} L1 ${mid} Z`}
            className="fill-bead stroke-accent"
            strokeWidth="1"
          />
          <path
            d={`M${mid} ${height * 0.3} L${height * 0.7} ${mid} L${mid} ${height * 0.7} L${height * 0.3} ${mid} Z`}
            className="fill-accent"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}
