import { ArrowRight, HandCoins, Heart, Sprout } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import type { ReactNode } from 'react'

import { CountUp, HoverLift, Reveal, Stagger, StaggerItem } from '@/components/motion'
import { BeadBand } from '@/components/sections/BeadBand'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Eyebrow, H1, H2, H3, Lead, Prose } from '@/components/ui/typography'
import { brandColors, mutedForeground, white } from '@/lib/brand'
import { contrastRatio, wcagLevel } from '@/lib/contrast'

export const metadata: Metadata = {
  title: 'Style guide',
  robots: { index: false, follow: false },
}

const { primary, primarySoft, accent, accentInk, bead, sand, ink } = brandColors

type Pair = { label: string; fg: string; bg: string }

/** Every text and background pair used by the design system. All must reach WCAG AA (4.5:1). */
const textPairs: Pair[] = [
  { label: 'Heading on white', fg: primary.hex, bg: white },
  { label: 'Heading on sand', fg: primary.hex, bg: sand.hex },
  { label: 'Heading on bead', fg: primary.hex, bg: bead.hex },
  { label: 'Body on white', fg: ink.hex, bg: white },
  { label: 'Body on sand', fg: ink.hex, bg: sand.hex },
  { label: 'Body on bead', fg: ink.hex, bg: bead.hex },
  { label: 'Muted text on white', fg: mutedForeground, bg: white },
  { label: 'Muted text on sand', fg: mutedForeground, bg: sand.hex },
  { label: 'Sand text on green (footer)', fg: sand.hex, bg: primary.hex },
  { label: 'Bead text on green', fg: bead.hex, bg: primary.hex },
  { label: 'Gold text on green (eyebrow)', fg: accent.hex, bg: primary.hex },
  { label: 'Donate button (green on gold)', fg: primary.hex, bg: accent.hex },
  { label: 'Deep gold on white (eyebrow)', fg: accentInk.hex, bg: white },
  { label: 'Deep gold on sand (eyebrow)', fg: accentInk.hex, bg: sand.hex },
  { label: 'Deep gold on bead', fg: accentInk.hex, bg: bead.hex },
  { label: 'Link on white', fg: primarySoft.hex, bg: white },
  { label: 'Link on sand', fg: primarySoft.hex, bg: sand.hex },
  { label: 'Primary button hover', fg: sand.hex, bg: primarySoft.hex },
]

const goldOnWhite = contrastRatio(accent.hex, white)

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="py-12">
      <h2 id={id} className="mb-6 font-serif text-2xl font-bold text-primary sm:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function StyleguidePage() {
  return (
    <div className="bg-white">
      <header className="bg-sand">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <Eyebrow>Design system</Eyebrow>
              <H1 className="mt-3">Style guide</H1>
              <Lead className="mt-4">
                Colours, type, buttons, cards and motion for the Enkaji Enkitati CBO website. This
                page is for the team and is not indexed.
              </Lead>
            </div>
            <Image
              src="/brand/logo-full.png"
              alt="Enkaji Enkitati CBO logo: a dome house, a gold path and a rising sun"
              width={1200}
              height={892}
              priority
              className="h-auto w-48 sm:w-56"
            />
          </div>
        </div>
        <BeadBand />
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Section id="colours" title="Colour tokens">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(brandColors).map((color) => (
              <li key={color.token} className="overflow-hidden rounded-xl border border-border">
                <div className="h-20" style={{ backgroundColor: color.hex }} aria-hidden="true" />
                <div className="p-4">
                  <p className="font-semibold text-ink">{color.name}</p>
                  <p className="text-sm text-muted-foreground">
                    <code>{color.token}</code> {color.hex}
                  </p>
                  <p className="mt-1 text-sm text-ink">{color.use}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-prose text-ink">
            Harvest gold on white measures {goldOnWhite.toFixed(2)}:1, which fails for text. It is
            used only for fills, icons, dividers and the focus ring, never for words on a light
            background.
          </p>
          <div
            className="mt-3 h-1.5 w-full max-w-prose rounded-full"
            style={{ backgroundColor: accent.hex }}
            aria-hidden="true"
          />
        </Section>

        <Section id="contrast" title="Contrast pairs (WCAG 2.1 AA)">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {textPairs.map((pair) => {
              const ratio = contrastRatio(pair.fg, pair.bg)
              const level = wcagLevel(ratio)
              return (
                <li key={pair.label} className="overflow-hidden rounded-xl border border-border">
                  <div
                    className="px-4 py-5 font-serif text-xl font-bold"
                    style={{ backgroundColor: pair.bg, color: pair.fg }}
                  >
                    Empowering Women
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-white px-4 py-3 text-sm text-ink">
                    <span>{pair.label}</span>
                    <span className="font-semibold whitespace-nowrap">
                      {ratio.toFixed(2)}:1 {level}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </Section>

        <Section id="type" title="Typography">
          <div className="space-y-8">
            <div>
              <Eyebrow>Eyebrow label</Eyebrow>
              <H1 className="mt-2">Heading one in Libre Baskerville</H1>
            </div>
            <H2>Heading two for section titles</H2>
            <H3>Heading three for cards and sub-sections</H3>
            <Lead>
              Lead paragraph. Women and girls are agents of change here, so we write warmly and
              specifically, without pity.
            </Lead>
            <p className="max-w-prose text-ink">
              Body text is Inter at 17 px with a 1.6 line height. Our programs support savings
              groups, girls&apos; dignity and health, mentorship, community development and
              vulnerable households in Ewaso Ng&apos;iro, Narok County.
            </p>
            <p className="text-sm text-muted-foreground">Small and caption text in muted ink.</p>
            <div className="rounded-xl bg-primary p-6">
              <Eyebrow tone="inverse">On green</Eyebrow>
              <H2 tone="inverse" className="mt-2">
                Inverse heading on forest green
              </H2>
            </div>
            <Prose>
              <h2>Rich text wrapper</h2>
              <p>
                Content from the CMS renders inside <code>Prose</code>, so editors never think about
                classes. It handles <a href="#type">links</a>, lists and quotes.
              </p>
              <ul>
                <li>Savings and loan groups</li>
                <li>Business and financial literacy training</li>
              </ul>
              <blockquote>Your story is still being written.</blockquote>
            </Prose>
          </div>
        </Section>

        <Section id="buttons" title="Buttons">
          <div className="flex flex-wrap items-center gap-4">
            <HoverLift className="inline-block">
              <Button>
                Partner with us <ArrowRight aria-hidden="true" />
              </Button>
            </HoverLift>
            <HoverLift className="inline-block">
              <Button variant="donate">
                <Heart aria-hidden="true" /> Donate
              </Button>
            </HoverLift>
            <HoverLift className="inline-block">
              <Button variant="outline">Learn more</Button>
            </HoverLift>
            <Button variant="secondary">Secondary</Button>
            <Button variant="link">Text link</Button>
            <Button disabled>Disabled</Button>
          </div>
          <p className="mt-4 max-w-prose text-sm text-muted-foreground">
            Buttons are at least 44 px tall. Tab to any of them to see the gold focus ring.
          </p>
        </Section>

        <Section id="cards" title="Cards">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <HoverLift>
              <Card className="h-full">
                <HandCoins className="size-8 text-accent" aria-hidden="true" />
                <CardTitle>Women Economic Empowerment</CardTitle>
                <CardDescription>
                  Savings groups, business skills and market links that turn women&apos;s work into
                  steady income.
                </CardDescription>
              </Card>
            </HoverLift>
            <HoverLift>
              <Card className="h-full bg-bead">
                <Sprout className="size-8 text-accent-ink" aria-hidden="true" />
                <CardTitle>Community Development</CardTitle>
                <CardDescription>
                  Tree planting, clean water, cleaner villages and youth sports.
                </CardDescription>
              </Card>
            </HoverLift>
            <HoverLift>
              <Card className="h-full border-primary bg-primary text-sand">
                <Heart className="size-8 text-accent" aria-hidden="true" />
                <CardTitle className="text-sand">Fund this program</CardTitle>
                <CardDescription className="text-sand">
                  Dark card with sand text on forest green.
                </CardDescription>
              </Card>
            </HoverLift>
          </div>
        </Section>

        <Section id="motion" title="Motion primitives">
          <p className="mb-6 max-w-prose text-ink">
            Scroll to replay entrance effects after a reload. With reduced motion switched on in the
            operating system, everything below renders instantly with no movement.
          </p>
          <div className="space-y-10">
            <Reveal>
              <Card>
                <CardTitle>Reveal</CardTitle>
                <CardDescription>
                  Fade and 16 px rise, once, 0.5 s ease-out, when 20% is in view.
                </CardDescription>
              </Card>
            </Reveal>

            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {['Save', 'Learn', 'Grow'].map((word) => (
                <StaggerItem key={word}>
                  <Card className="bg-sand">
                    <CardTitle>{word}</CardTitle>
                    <CardDescription>Stagger item, 0.06 s apart.</CardDescription>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>

            <Card className="max-w-sm">
              <CardTitle>CountUp</CardTitle>
              <p className="font-serif text-5xl font-bold text-primary">
                <CountUp value={5} />
              </p>
              <CardDescription>
                Program areas in the CBO plan. Counters are used only for verified numbers.
              </CardDescription>
            </Card>
          </div>
        </Section>
      </div>
    </div>
  )
}
