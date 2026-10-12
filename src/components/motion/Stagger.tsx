'use client'

import { LazyMotion, m, useReducedMotion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

import { loadMotionFeatures } from './load-features'

type Tag = 'div' | 'ul' | 'ol' | 'li' | 'section'

const tags = {
  div: m.div,
  ul: m.ul,
  ol: m.ol,
  li: m.li,
  section: m.section,
} as const

type StaggerProps = {
  children: ReactNode
  className?: string
  as?: Tag
}

/**
 * Lists and card grids: children enter 0.06 s apart once the group is in view.
 * With reduced motion the stagger and the movement collapse to an instant change.
 */
export function Stagger({ children, className, as = 'div' }: StaggerProps) {
  const reduce = useReducedMotion()
  const Animated = tags[as]
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.06 } },
  }

  return (
    <LazyMotion features={loadMotionFeatures}>
      <Animated
        className={className}
        variants={variants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {children}
      </Animated>
    </LazyMotion>
  )
}

/** Child of Stagger. Place it directly inside a Stagger so it inherits the variant state. */
export function StaggerItem({ children, className, as = 'div' }: StaggerProps) {
  const reduce = useReducedMotion()
  const Animated = tags[as]
  const variants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' },
    },
  }

  return (
    <LazyMotion features={loadMotionFeatures}>
      <Animated className={`motion-reveal ${className ?? ''}`.trim()} variants={variants}>
        {children}
      </Animated>
    </LazyMotion>
  )
}
