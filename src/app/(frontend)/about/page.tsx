import { Eye, Target } from 'lucide-react'
import type { Metadata } from 'next'

import {
  ApproachSteps,
  FeatureCard,
  ObjectivesGrid,
  ValueList,
} from '@/components/about/AboutBlocks'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal } from '@/components/motion'
import { CtaBand } from '@/components/sections/CtaBand'
import { NarokMap } from '@/components/sections/NarokMap'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { Prose } from '@/components/ui/typography'
import { RichText } from '@/components/ui/RichText'
import { getAbout } from '@/lib/about-data'
import { isLexicalState, splitSteps } from '@/lib/lexical'

export const metadata: Metadata = {
  title: 'About us',
  description:
    'Enkaji Enkitati CBO is a women-led community-based organization in Ewaso Ng’iro, Narok County. Our vision, mission, values, objectives and community-led approach.',
  alternates: { canonical: '/about' },
}

export default async function AboutPage() {
  const about = await getAbout()
  if (!about) throw new Error('The About content could not be loaded')

  const values = (about.values ?? []).filter((value) => value.title)
  const objectives = (about.objectives ?? []).map((item) => item.text).filter(Boolean)
  const approach = isLexicalState(about.approach) ? splitSteps(about.approach) : null

  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Who we are"
        lead="A women-led community-based organization in Narok County, Kenya, where communities name their own problems and lead their own solutions."
        breadcrumb={[{ label: 'About' }]}
      />

      {isLexicalState(about.story) && (
        <Section aria-labelledby="story-title">
          <Reveal className="max-w-3xl">
            <SectionHeading
              id="story-title"
              eyebrow="Our story"
              title="Rooted in Ewaso Ng’iro"
              className="mb-5"
            />
            <Prose className="text-lg">
              <RichText data={about.story} />
            </Prose>
          </Reveal>
        </Section>
      )}

      {(about.vision || about.mission) && (
        <Section tone="sand" aria-labelledby="direction-title">
          <Reveal>
            <SectionHeading
              id="direction-title"
              eyebrow="Where we are going"
              title="Our vision and mission"
            />
            <div className="grid gap-6 md:grid-cols-2">
              {about.vision && (
                <FeatureCard icon={Eye} label="Vision">
                  {about.vision}
                </FeatureCard>
              )}
              {about.mission && (
                <FeatureCard icon={Target} label="Mission">
                  {about.mission}
                </FeatureCard>
              )}
            </div>
          </Reveal>
        </Section>
      )}

      {values.length > 0 && (
        <Section aria-labelledby="values-title">
          <Reveal>
            <SectionHeading id="values-title" eyebrow="How we work" title="What we value" />
            <ValueList values={values} />
          </Reveal>
        </Section>
      )}

      {objectives.length > 0 && (
        <Section tone="sand" aria-labelledby="objectives-title">
          <Reveal>
            <SectionHeading
              id="objectives-title"
              eyebrow="Our constitution"
              title="Our objectives"
              intro="The aims our members agreed when they founded the CBO."
            />
            <ObjectivesGrid objectives={objectives} />
          </Reveal>
        </Section>
      )}

      {about.areaOfOperation && (
        <Section aria-labelledby="area-title">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <SectionHeading
                id="area-title"
                eyebrow="Area of operation"
                title="Where we work"
                intro={about.areaOfOperation}
                className="mb-0"
              />
            </Reveal>
            <Reveal delay={0.1}>
              <NarokMap />
            </Reveal>
          </div>
        </Section>
      )}

      {approach && (approach.intro || approach.steps.length > 0) && (
        <Section tone="sand" aria-labelledby="approach-title">
          <Reveal>
            <SectionHeading
              id="approach-title"
              eyebrow="Community-led change"
              title="Our approach"
              intro={approach.intro || undefined}
            />
            {approach.steps.length > 0 && <ApproachSteps steps={approach.steps} />}
          </Reveal>
        </Section>
      )}

      <CtaBand />
    </>
  )
}
