import { Section } from '@/components/layout/Section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'

import { SdgBadge } from './SdgBadge'
import { SectionHeading } from './SectionHeading'

export function SdgStrip({ goals }: { goals: string[] }) {
  if (goals.length === 0) return null

  return (
    <Section tone="sand" aria-labelledby="sdg-title" className="py-10 sm:py-12">
      <Reveal>
        <SectionHeading
          id="sdg-title"
          eyebrow="Global goals"
          title="Local work, global goals"
          intro="Our programs contribute to these Sustainable Development Goals."
          action={{ label: 'Our impact', href: '/impact' }}
          className="mb-6"
        />
      </Reveal>
      <Stagger as="ul" className="flex flex-wrap gap-3">
        {goals.map((goal) => (
          <StaggerItem as="li" key={goal}>
            <SdgBadge number={goal} className="bg-white px-4 py-2 text-base ring-1 ring-border" />
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  )
}
