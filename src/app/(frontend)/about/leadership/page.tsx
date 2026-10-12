import type { Metadata } from 'next'
import Link from 'next/link'

import { LeaderCard } from '@/components/about/LeaderCard'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { Button } from '@/components/ui/button'
import { getLeaders } from '@/lib/about-data'

export const metadata: Metadata = {
  title: 'Leadership',
  description:
    'Meet the elected officials who lead Enkaji Enkitati CBO: chairperson, vice chairperson, secretary, assistant secretary and treasurer.',
  alternates: { canonical: '/about/leadership' },
}

export default async function LeadershipPage() {
  const leaders = await getLeaders()

  return (
    <>
      <PageHero
        eyebrow="Leadership"
        title="The women who lead us"
        lead="Five officials, elected by our members, guide the CBO. Decisions are made together at monthly general meetings."
        breadcrumb={[{ label: 'About', href: '/about' }, { label: 'Leadership' }]}
      />

      <Section aria-label="Officials">
        {leaders.length > 0 ? (
          <Stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leaders.map((leader) => (
              <StaggerItem as="li" key={leader.id}>
                <LeaderCard leader={leader} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <Reveal className="max-w-2xl">
            <p className="text-lg text-ink">
              Profiles of our committee will appear here once each member has agreed to how she is
              shown on the site. Until then, you can read about how the committee works.
            </p>
          </Reveal>
        )}
      </Section>

      <Section tone="sand" aria-labelledby="how-title" className="py-10 sm:py-12">
        <Reveal className="max-w-3xl">
          <h2 id="how-title" className="font-serif text-2xl font-bold text-primary">
            How the committee is held to account
          </h2>
          <p className="mt-3 text-lg text-ink">
            The committee meets with all members every month, follows a written constitution and
            reports on money and activities on a fixed cycle.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/about/governance">Governance and accountability</Link>
          </Button>
        </Reveal>
      </Section>
    </>
  )
}
