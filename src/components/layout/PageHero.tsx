import Link from 'next/link'
import type { ReactNode } from 'react'

import { Reveal } from '@/components/motion'
import { BeadBand } from '@/components/sections/BeadBand'
import { Eyebrow, H1, Lead } from '@/components/ui/typography'

import { Container } from './Container'

export type Crumb = { label: string; href?: string }

type PageHeroProps = {
  eyebrow?: string
  title: string
  lead?: string
  /** Trail from the home page to this page. The last item is the current page. */
  breadcrumb?: Crumb[]
  /** Optional icon shown in a gold circle above the eyebrow. */
  icon?: ReactNode
  /** Optional extra content under the lead, for example badges. */
  children?: ReactNode
}

/**
 * Opening band of an inner page. It renders the page's only h1: pages must not add another one.
 */
export function PageHero({ eyebrow, title, lead, breadcrumb, icon, children }: PageHeroProps) {
  const trail: Crumb[] = breadcrumb ? [{ label: 'Home', href: '/' }, ...breadcrumb] : []

  return (
    <div className="bg-sand">
      <Container className="py-10 sm:py-14">
        {trail.length > 1 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-x-2 text-sm text-ink">
              {trail.map((crumb, index) => {
                const last = index === trail.length - 1
                return (
                  <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                    {last || !crumb.href ? (
                      <span aria-current={last ? 'page' : undefined} className="font-semibold">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="inline-flex min-h-11 items-center text-primary-soft underline underline-offset-4 hover:text-primary"
                      >
                        {crumb.label}
                      </Link>
                    )}
                    {!last && <span aria-hidden="true">/</span>}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}
        <Reveal className="max-w-3xl">
          {icon && (
            <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-primary text-accent">
              {icon}
            </span>
          )}
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <H1 className={eyebrow ? 'mt-3' : undefined}>{title}</H1>
          {lead && <Lead className="mt-4">{lead}</Lead>}
          {children}
        </Reveal>
      </Container>
      <BeadBand />
    </div>
  )
}
