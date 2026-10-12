import { Section } from '@/components/layout/Section'
import { Reveal } from '@/components/motion'
import type { HomeContent } from '@/lib/home-data'

import { NarokMap } from './NarokMap'
import { SectionHeading } from './SectionHeading'

export function WhereWeWork({ content }: { content: HomeContent }) {
  return (
    <Section aria-labelledby="where-title">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <SectionHeading
            id="where-title"
            eyebrow="Our home"
            title={content.whereHeading}
            intro={content.whereText}
            className="mb-0"
          />
        </Reveal>
        <Reveal delay={0.1}>
          <NarokMap />
        </Reveal>
      </div>
    </Section>
  )
}
