import { Heart } from 'lucide-react'
import Link from 'next/link'

import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/button'
import { Eyebrow, H1, Lead } from '@/components/ui/typography'
import type { HomeContent } from '@/lib/home-data'

import { BeadBand } from './BeadBand'
import {
  heroMarkBase,
  heroMarkPath,
  heroMarkPathD,
  heroMarkPathLength,
} from './hero-mark.generated'

/**
 * The logo mark as inline vector paths (traced from the logo by scripts/brand-assets.ts), with the
 * gold path drawn in once. A mask stroke along the path's centreline reveals it (see globals.css;
 * the animation is off for reduced motion). It is vector rather than an image so it is not a
 * largest-contentful-paint candidate, and pure CSS, so it needs no JavaScript.
 */
function HeroMark() {
  return (
    <svg
      viewBox="0 0 512 512"
      role="img"
      aria-label="The Enkaji Enkitati logo: a girl with a book walks a gold path through a dome house toward a rising sun"
      className="mx-auto h-auto w-full max-w-[18rem] sm:max-w-sm lg:max-w-md"
    >
      <defs>
        <mask id="hero-path-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
          <path
            d={heroMarkPathD}
            fill="none"
            stroke="#fff"
            strokeWidth="120"
            className="hero-path-draw"
            style={{ ['--path-length' as string]: heroMarkPathLength }}
          />
        </mask>
      </defs>
      {heroMarkBase.map((layer) => (
        <path key={layer.fill} d={layer.d} fill={layer.fill} />
      ))}
      <g mask="url(#hero-path-mask)">
        {heroMarkPath.map((layer) => (
          <path key={layer.fill} d={layer.d} fill={layer.fill} />
        ))}
      </g>
    </svg>
  )
}

/**
 * Home hero. The headline and lead are plain, immediately visible text with no entrance
 * animation, so they are the largest contentful paint rather than an image.
 */
export function Hero({ content }: { content: HomeContent }) {
  return (
    <section aria-labelledby="hero-title" className="bg-sand">
      <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
        <div>
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <H1 id="hero-title" className="mt-3">
            {content.headline}
          </H1>
          <Lead className="mt-5">{content.lead}</Lead>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="donate" size="lg">
              <Link href="/donate">
                <Heart aria-hidden="true" /> {content.donateLabel}
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/partner">{content.partnerLabel}</Link>
            </Button>
          </div>
        </div>
        <HeroMark />
      </Container>
      <BeadBand />
    </section>
  )
}
