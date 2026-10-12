import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Eyebrow, H2 } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

type SectionHeadingProps = {
  id: string
  eyebrow?: string
  title: string
  intro?: ReactNode
  /** Optional link shown beside the heading on wide screens. */
  action?: { label: string; href: string }
  tone?: 'default' | 'inverse'
  className?: string
}

/** Eyebrow, h2 and optional intro and link for a home page section. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  action,
  tone = 'default',
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
        <H2 id={id} tone={tone} className={eyebrow ? 'mt-2' : undefined}>
          {title}
        </H2>
        {intro && (
          <p className={cn('mt-3 text-lg', tone === 'inverse' ? 'text-sand' : 'text-ink')}>
            {intro}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary-soft underline underline-offset-4 hover:text-primary"
        >
          {action.label}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </div>
  )
}
