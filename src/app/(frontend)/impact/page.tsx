import type { Metadata } from 'next'

import { DocumentList } from '@/components/about/DocumentList'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal } from '@/components/motion'
import { PlanChart, SdgAlignment, TargetList } from '@/components/programs/ImpactBlocks'
import { CtaBand } from '@/components/sections/CtaBand'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { RichText } from '@/components/ui/RichText'
import { Prose } from '@/components/ui/typography'
import { getImpact } from '@/lib/programs-data'

export const metadata: Metadata = {
  title: 'Impact and SDGs',
  description:
    'How Enkaji Enkitati CBO’s work connects to the Sustainable Development Goals, our 2026 to 2030 targets and our planned annual budget. We report results only when we can show evidence.',
  alternates: { canonical: '/impact' },
}

export default async function ImpactPage() {
  const impact = await getImpact()

  return (
    <>
      <PageHero
        eyebrow="Impact and SDGs"
        title="Our impact"
        lead="How our work connects to the global goals, and what we plan to build. We report results only when we can show evidence for them."
        breadcrumb={[{ label: 'Impact' }]}
      />

      {impact.intro && (
        <Section aria-label="Introduction" className="pb-0 sm:pb-0">
          <Reveal className="max-w-3xl">
            <Prose className="text-lg">
              <RichText data={impact.intro} />
            </Prose>
          </Reveal>
        </Section>
      )}

      {impact.sdgAlignment.length > 0 && (
        <Section aria-labelledby="sdg-title">
          <Reveal>
            <SectionHeading
              id="sdg-title"
              eyebrow="Global goals"
              title="SDG alignment"
              intro="The Sustainable Development Goals our activities contribute to."
            />
            <SdgAlignment rows={impact.sdgAlignment} />
          </Reveal>
        </Section>
      )}

      {impact.targets.length > 0 && (
        <Section tone="sand" aria-labelledby="targets-title">
          <Reveal>
            <SectionHeading
              id="targets-title"
              eyebrow="Plans, not results"
              title={impact.targetsLabel}
              intro="What we aim to build between 2026 and 2030. These are targets. We will publish results here only when we can show evidence for them."
            />
            <TargetList targets={impact.targets} />
          </Reveal>
        </Section>
      )}

      {impact.annualPlan.length > 0 && (
        <Section aria-labelledby="plan-title">
          <Reveal>
            <SectionHeading
              id="plan-title"
              eyebrow="Our budget"
              title="Annual plan by objective"
              intro="How we plan to use our 2026 budget across our objectives."
            />
            <PlanChart plan={impact.annualPlan} />
          </Reveal>
        </Section>
      )}

      {impact.annualReports.length > 0 && (
        <Section tone="sand" aria-labelledby="reports-title">
          <Reveal>
            <SectionHeading
              id="reports-title"
              eyebrow="Reports"
              title="Annual reports"
              intro="Reports on what we have done, as PDF files."
            />
            <DocumentList documents={impact.annualReports} />
          </Reveal>
        </Section>
      )}

      <CtaBand />
    </>
  )
}
