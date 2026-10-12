import { Section } from '@/components/layout/Section'
import { Reveal } from '@/components/motion'
import type { ProgramCard } from '@/lib/home-data'

import { ProgramCards } from './cards'
import { SectionHeading } from './SectionHeading'

export function ProgramGrid({ programs }: { programs: ProgramCard[] }) {
  if (programs.length === 0) return null

  return (
    <Section tone="sand" aria-labelledby="programs-title">
      <Reveal>
        <SectionHeading
          id="programs-title"
          eyebrow="Our programs"
          title="Five ways we stand with women and girls"
          action={{ label: 'All programs', href: '/programs' }}
        />
      </Reveal>
      <ProgramCards programs={programs} />
    </Section>
  )
}
