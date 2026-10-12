'use client'

import { LazyMotion, m, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import { loadMotionFeatures } from './load-features'

type HoverLiftProps = {
  children: ReactNode
  className?: string
  /** Lift in pixels on hover, kept within the 2 to 4 px range of the motion rules. */
  lift?: 2 | 3 | 4
}

/**
 * Cards and buttons: lift with a deeper shadow on hover, scale 0.98 on tap.
 * With reduced motion the hover and tap effects are switched off.
 */
export function HoverLift({ children, className, lift = 3 }: HoverLiftProps) {
  const reduce = useReducedMotion()

  return (
    <LazyMotion features={loadMotionFeatures}>
      <m.div
        className={className}
        // Motion makes tappable elements focusable; -1 keeps this wrapper out of the tab order.
        tabIndex={-1}
        whileHover={
          reduce ? undefined : { y: -lift, boxShadow: '0 12px 24px -10px rgba(28, 56, 14, 0.35)' }
        }
        whileTap={reduce ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ borderRadius: 'inherit', outline: 'none' }}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
}
