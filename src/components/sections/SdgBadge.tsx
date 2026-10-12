import { sdgName } from '@/lib/sdg'
import { cn } from '@/lib/utils'

/**
 * Text badge for a Sustainable Development Goal. It uses words, not the official UN icons.
 * `compact` shows only "SDG 5" with the name available to screen readers.
 */
export function SdgBadge({
  number,
  compact = false,
  className,
}: {
  number: number | string
  compact?: boolean
  className?: string
}) {
  const name = sdgName(number)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-bead px-3 py-1 text-sm font-semibold text-primary',
        className,
      )}
    >
      SDG {number}
      {compact ? (
        <span className="sr-only">: {name}</span>
      ) : (
        <span className="ml-1.5 font-normal">{name}</span>
      )}
    </span>
  )
}
