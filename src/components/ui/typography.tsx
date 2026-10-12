import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type Tone = 'default' | 'inverse'

const headingTone: Record<Tone, string> = {
  default: 'text-primary',
  inverse: 'text-sand',
}

/** Spaced serif capitals above a heading. Deep gold on light, harvest gold on green. */
export function Eyebrow({
  className,
  tone = 'default',
  ...props
}: ComponentProps<'p'> & { tone?: Tone }) {
  return (
    <p
      className={cn(
        'font-serif text-sm font-bold tracking-[0.2em] uppercase',
        tone === 'inverse' ? 'text-accent' : 'text-accent-ink',
        className,
      )}
      {...props}
    />
  )
}

export function H1({
  className,
  tone = 'default',
  ...props
}: ComponentProps<'h1'> & { tone?: Tone }) {
  return (
    <h1
      className={cn(
        'font-serif text-4xl leading-[1.15] font-bold text-balance sm:text-5xl lg:text-6xl',
        headingTone[tone],
        className,
      )}
      {...props}
    />
  )
}

export function H2({
  className,
  tone = 'default',
  ...props
}: ComponentProps<'h2'> & { tone?: Tone }) {
  return (
    <h2
      className={cn(
        'font-serif text-3xl leading-tight font-bold text-balance sm:text-4xl',
        headingTone[tone],
        className,
      )}
      {...props}
    />
  )
}

export function H3({
  className,
  tone = 'default',
  ...props
}: ComponentProps<'h3'> & { tone?: Tone }) {
  return (
    <h3
      className={cn(
        'font-serif text-xl leading-snug font-bold text-balance sm:text-2xl',
        headingTone[tone],
        className,
      )}
      {...props}
    />
  )
}

export function Lead({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn('max-w-prose text-lg leading-relaxed text-ink sm:text-xl', className)}
      {...props}
    />
  )
}

/** Wrapper that styles rich text (Lexical output, markdown) without per-element classes. */
export function Prose({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('prose-enkaji', className)} {...props} />
}
