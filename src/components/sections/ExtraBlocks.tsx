import { icons, Circle } from 'lucide-react'
import Link from 'next/link'

import { Section } from '@/components/layout/Section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { Button } from '@/components/ui/button'
import { H2 } from '@/components/ui/typography'
import type { ExtraBlock } from '@/lib/page-parts'

const external = (href: string) => /^https?:\/\//.test(href)

function BlockLink({
  href,
  label,
  variant,
}: {
  href: string
  label: string
  variant: 'donate' | 'default'
}) {
  return (
    <Button asChild variant={variant} size="lg">
      {external(href) ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {label}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <Link href={href}>{label}</Link>
      )}
    </Button>
  )
}

/**
 * Renders the call-to-action, cards and FAQ blocks an editor adds below the main content of a CMS
 * page, so nothing added in the admin is silently dropped.
 */
export function ExtraBlocks({ blocks }: { blocks: ExtraBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const id = `extra-${index}`
        if (block.blockType === 'cta') {
          return (
            <Section key={block.id ?? id} tone="sand" aria-labelledby={id}>
              <Reveal className="max-w-3xl">
                <H2 id={id}>{block.heading}</H2>
                {block.text && <p className="mt-3 text-lg text-ink">{block.text}</p>}
                {block.buttonHref && block.buttonLabel && (
                  <div className="mt-6">
                    <BlockLink
                      href={block.buttonHref}
                      label={block.buttonLabel}
                      variant={block.variant === 'donate' ? 'donate' : 'default'}
                    />
                  </div>
                )}
              </Reveal>
            </Section>
          )
        }
        if (block.blockType === 'cards') {
          return (
            <Section key={block.id ?? id} aria-labelledby={id}>
              <Reveal>
                {block.heading && (
                  <H2 id={id} className="mb-8">
                    {block.heading}
                  </H2>
                )}
              </Reveal>
              <Stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(block.items ?? []).map((item) => {
                  const Icon = (item.icon && icons[item.icon as keyof typeof icons]) || Circle
                  return (
                    <StaggerItem as="li" key={item.id ?? item.title}>
                      <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-white p-6">
                        <span className="inline-flex size-12 items-center justify-center rounded-full bg-bead text-accent-ink">
                          <Icon aria-hidden="true" className="size-6" />
                        </span>
                        <h3 className="font-serif text-xl font-bold text-primary">{item.title}</h3>
                        {item.text && <p className="text-ink">{item.text}</p>}
                        {item.href && (
                          <Link
                            href={item.href}
                            className="mt-auto inline-flex min-h-11 items-center font-semibold text-primary-soft underline underline-offset-4"
                          >
                            Learn more
                          </Link>
                        )}
                      </div>
                    </StaggerItem>
                  )
                })}
              </Stagger>
            </Section>
          )
        }
        return (
          <Section key={block.id ?? id} tone="sand" aria-labelledby={id}>
            <Reveal className="max-w-3xl">
              <H2 id={id} className="mb-6">
                {block.heading ?? 'Questions'}
              </H2>
              <div className="divide-y divide-border rounded-xl border border-border bg-white">
                {(block.items ?? []).map((item) => (
                  <details key={item.id ?? item.question} className="group p-5">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-serif text-lg font-bold text-primary [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <span
                        aria-hidden="true"
                        className="ml-4 text-accent-ink group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-ink">{item.answer}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </Section>
        )
      })}
    </>
  )
}
