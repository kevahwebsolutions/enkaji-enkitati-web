import type { Metadata } from 'next'

import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal } from '@/components/motion'
import { CtaBand } from '@/components/sections/CtaBand'
import { ProgramCards } from '@/components/sections/cards'
import { getPrograms } from '@/lib/programs-data'

export const metadata: Metadata = {
  title: 'Programs',
  description:
    'Five programs in Ewaso Ng’iro, Narok County: women’s economic empowerment, girls’ dignity and health, education and mentorship, community development and support for vulnerable households.',
  alternates: { canonical: '/programs' },
}

export default async function ProgramsPage() {
  const programs = await getPrograms()

  return (
    <>
      <PageHero
        eyebrow="What we do"
        title="Our programs"
        lead="Five programs, one aim: women and girls who live with dignity, equality and opportunity. Each one is led with the community it serves."
        breadcrumb={[{ label: 'Programs' }]}
      />

      <Section aria-label="Programs">
        {programs.length > 0 ? (
          <ProgramCards programs={programs} headingLevel="h2" />
        ) : (
          <Reveal className="max-w-2xl">
            <p className="text-lg text-ink">Our programs will be listed here soon.</p>
          </Reveal>
        )}
      </Section>

      <CtaBand />
    </>
  )
}
