import type { ComponentProps } from 'react'

import { BeadBand } from '@/components/sections/BeadBand'
import { cn } from '@/lib/utils'

import { Container } from './Container'

type SectionProps = Omit<ComponentProps<'section'>, 'title'> & {
  /** Sand background for alternating bands. */
  tone?: 'white' | 'sand'
  /** Bead-diamond divider above the section. */
  divider?: boolean
  /** Remove the Container so the content can run edge to edge. */
  bleed?: boolean
}

/** Vertical band of a page. Give it `aria-labelledby` pointing at its heading. */
export function Section({
  tone = 'white',
  divider = false,
  bleed = false,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <>
      {divider && <BeadBand />}
      <section className={cn('py-12 sm:py-16', tone === 'sand' && 'bg-sand', className)} {...props}>
        {bleed ? children : <Container>{children}</Container>}
      </section>
    </>
  )
}
