import Link from 'next/link'

import { Reveal } from '@/components/motion'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'
import type { HomeContent } from '@/lib/home-data'

import { SectionHeading } from './SectionHeading'

export function WhoWeAre({ content }: { content: HomeContent }) {
  return (
    <Section aria-labelledby="who-title">
      <Reveal className="max-w-3xl">
        <SectionHeading
          id="who-title"
          eyebrow="Who we are"
          title="Women leading change in their own communities"
          className="mb-5"
        />
        <p className="text-lg text-ink">{content.aboutText}</p>
        {content.vision && (
          <blockquote className="mt-6 border-l-4 border-accent pl-4 font-serif text-xl font-bold text-primary">
            <p>{content.vision}</p>
            <footer className="mt-2 font-sans text-sm text-ink">Our vision</footer>
          </blockquote>
        )}
        <Button asChild variant="outline" className="mt-8">
          <Link href="/about">More about us</Link>
        </Button>
      </Reveal>
    </Section>
  )
}
