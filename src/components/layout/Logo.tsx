import Image from 'next/image'

import { cn } from '@/lib/utils'

type LogoProps = {
  /** "default" is the full-colour mark on light surfaces; "cream" is the one-colour mark for green. */
  tone?: 'default' | 'cream'
  className?: string
  markClassName?: string
  wordmarkClassName?: string
}

/**
 * Horizontal lockup (SRS 9.4): the mark from the logo plus the wordmark set in the site serif as
 * spaced capitals (SRS 9.2). Live text keeps the name crisp and readable at header size.
 */
export function Logo({ tone = 'default', className, markClassName, wordmarkClassName }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src={tone === 'cream' ? '/brand/logo-mark-cream.png' : '/brand/logo-mark.png'}
        alt=""
        width={512}
        height={512}
        sizes="56px"
        priority={tone === 'default'}
        className={cn('size-12 shrink-0', markClassName)}
      />
      <span
        className={cn(
          'font-serif text-[0.7rem] leading-tight font-bold tracking-[0.1em] max-w-[7.5rem] uppercase sm:max-w-none sm:text-sm sm:tracking-[0.16em] sm:whitespace-nowrap',
          tone === 'cream' ? 'text-sand' : 'text-primary',
          wordmarkClassName,
        )}
      >
        Enkaji Enkitati CBO
      </span>
    </span>
  )
}
