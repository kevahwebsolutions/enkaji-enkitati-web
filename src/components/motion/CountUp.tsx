'use client'

import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

type CountUpProps = {
  /** A real, verified number. Never use it for estimates or targets presented as results. */
  value: number
  prefix?: string
  suffix?: string
  /** Animation length in seconds. */
  duration?: number
  className?: string
}

const format = new Intl.NumberFormat('en-KE')

/** Counts from 0 to `value` once when scrolled into view. Shows the final value when motion is reduced. */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  duration = 1.4,
  className,
}: CountUpProps) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const text = (n: number) => `${prefix}${format.format(n)}${suffix}`

  useEffect(() => {
    const node = ref.current
    if (reduce || !inView || !node) return
    node.textContent = text(0)
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        node.textContent = text(Math.round(latest))
      },
    })
    return () => controls.stop()
    // text() only depends on prefix and suffix, which are listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value, duration, prefix, suffix])

  return (
    <span className={className}>
      <span className="sr-only">{text(value)}</span>
      {/* The animated span is updated directly; its server-rendered text is the final value. */}
      <span ref={ref} aria-hidden="true" suppressHydrationWarning>
        {text(value)}
      </span>
    </span>
  )
}
