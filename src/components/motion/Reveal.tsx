'use client'

import { LazyMotion, m, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import { loadMotionFeatures } from './load-features'

type RevealProps = {
  children: ReactNode
  className?: string
  /** Delay in seconds before the entrance starts. */
  delay?: number
}

/**
 * Section entrance: fade plus 16 px rise, once, when 20% of the element is in view.
 * With reduced motion the same element is used (so server and client markup match) but the
 * change is instant, with no visible movement.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduce = useReducedMotion()

  return (
    <LazyMotion features={loadMotionFeatures}>
      <m.div
        className={`motion-reveal ${className ?? ''}`.trim()}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeOut', delay }}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
}
