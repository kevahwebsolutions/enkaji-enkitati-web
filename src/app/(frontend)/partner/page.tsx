import { HeartHandshake, Target, UsersRound, Eye } from 'lucide-react'
import type { Metadata } from 'next'

import { DocumentList } from '@/components/about/DocumentList'
import { SponsorTiers } from '@/components/events/EventBlocks'
import { AppForm } from '@/components/forms/AppForm'
import { partnershipFields } from '@/components/forms/definitions'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { PlanChart } from '@/components/programs/ImpactBlocks'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { getDocuments } from '@/lib/about-data'
import { turnstileSiteKey } from '@/lib/forms/turnstile'
import { getImpact } from '@/lib/programs-data'
import { DEFAULT_SPONSOR_TIERS } from '@/lib/sponsor-tiers'

export const metadata: Metadata = {
  title: 'Partner with us',
  description:
    'Donors, NGOs, government agencies and businesses can partner with Enkaji Enkitati CBO to support women and girls in Narok County.',
  alternates: { canonical: '/partner' },
}

const REASONS = [
  {
    icon: UsersRound,
    title: 'Grassroots trust',
    text: 'We are women from the community we serve, and neighbours know us.',
  },
  {
    icon: Target,
    title: 'Programs that line up with the SDGs',
    text: 'Our five programs map to the Sustainable Development Goals.',
  },
  {
    icon: HeartHandshake,
    title: 'A focus on women and girls',
    text: 'Savings, schooling, health and dignity for women and girls in rural Maasai communities.',
  },
  {
    icon: Eye,
    title: 'Community-led and open',
    text: 'Two signatures on every withdrawal and a financial report every month.',
  },
]

export default async function PartnerPage() {
  const [impact, documents] = await Promise.all([getImpact(), getDocuments()])
  const profiles = documents.filter((doc) => doc.type === 'profile')

  return (
    <>
      <PageHero
        eyebrow="Partner with us"
        title="Support women and girls in Narok"
        lead="We invite donors, NGOs, government agencies and businesses to work with a women-led, community-run organization."
        breadcrumb={[{ label: 'Partner with us' }]}
      />

      <Section aria-labelledby="why-title">
        <Reveal>
          <SectionHeading id="why-title" eyebrow="Why partner" title="Why work with us" />
        </Reveal>
        <Stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map(({ icon: Icon, title, text }) => (
            <StaggerItem as="li" key={title}>
              <div className="h-full rounded-xl border border-border bg-white p-6">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-bead text-accent-ink">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h3 className="mt-4 font-serif text-xl font-bold text-primary">{title}</h3>
                <p className="mt-2 text-ink">{text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {impact.annualPlan.length > 0 && (
        <Section tone="sand" aria-labelledby="budget-title">
          <Reveal>
            <SectionHeading
              id="budget-title"
              eyebrow="Our budget"
              title="Planned annual budget by objective"
              intro="Where we plan to use funds. Partners can see exactly which objective they would support."
            />
            <PlanChart plan={impact.annualPlan} />
          </Reveal>
        </Section>
      )}

      <Section aria-labelledby="tiers-title">
        <Reveal>
          <SectionHeading
            id="tiers-title"
            eyebrow="Event sponsorship"
            title="Sponsorship levels"
            intro="Businesses can sponsor our events at these levels."
          />
          <SponsorTiers tiers={DEFAULT_SPONSOR_TIERS} />
        </Reveal>
      </Section>

      {profiles.length > 0 && (
        <Section tone="sand" aria-labelledby="profile-title">
          <Reveal>
            <SectionHeading
              id="profile-title"
              eyebrow="Download"
              title="Organization profile"
              intro="Our profile as a PDF, to share with your team."
            />
            <DocumentList documents={profiles} />
          </Reveal>
        </Section>
      )}

      <Section aria-labelledby="enquiry-title" id="enquiry">
        <Reveal className="max-w-2xl">
          <SectionHeading
            id="enquiry-title"
            eyebrow="Enquiry"
            title="Start a conversation"
            className="mb-6"
          />
          <AppForm
            formType="partnership"
            fields={partnershipFields}
            submitLabel="Send enquiry"
            siteKey={turnstileSiteKey()}
            successTitle="Enquiry received"
          />
        </Reveal>
      </Section>
    </>
  )
}
