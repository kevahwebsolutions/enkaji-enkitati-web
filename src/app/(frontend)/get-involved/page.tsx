import type { Metadata } from 'next'

import { AppForm } from '@/components/forms/AppForm'
import { joinFields, schoolVisitFields, volunteerFields } from '@/components/forms/definitions'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { NamedIcon } from '@/components/sections/cards'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { turnstileSiteKey } from '@/lib/forms/turnstile'
import { VOLUNTEER_ROLES } from '@/lib/volunteer-roles'

export const metadata: Metadata = {
  title: 'Get involved',
  description:
    'Volunteer with Enkaji Enkitati CBO, invite us to your school for an Ignite Dreams mentorship visit, or ask to join the CBO.',
  alternates: { canonical: '/get-involved' },
}

export default function GetInvolvedPage() {
  const siteKey = turnstileSiteKey()

  return (
    <>
      <PageHero
        eyebrow="Get involved"
        title="Join us"
        lead="Give your time, invite us into your school, or become a member. Choose the form that fits."
        breadcrumb={[{ label: 'Get involved' }]}
      />

      <Section tone="sand" aria-labelledby="roles-title">
        <Reveal>
          <SectionHeading
            id="roles-title"
            eyebrow="Volunteer roles"
            title="Ways to help"
            intro="Pick the role that suits your time and skills, then fill in the form below."
          />
        </Reveal>
        <Stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VOLUNTEER_ROLES.map((role) => (
            <StaggerItem as="li" key={role.title}>
              <div className="h-full rounded-xl border border-border bg-white p-6">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-bead text-accent-ink">
                  <NamedIcon name={role.icon} className="size-6" />
                </span>
                <h3 className="mt-4 font-serif text-xl font-bold text-primary">{role.title}</h3>
                <p className="mt-2 text-ink">{role.summary}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <Section aria-labelledby="volunteer-title" id="volunteer">
        <Reveal className="max-w-2xl">
          <SectionHeading
            id="volunteer-title"
            eyebrow="Volunteer"
            title="Offer your time"
            intro="Mentors, helpers at events, skills trainers and office support are all welcome."
            className="mb-6"
          />
          <AppForm
            formType="volunteer"
            fields={volunteerFields}
            submitLabel="Sign me up"
            siteKey={siteKey}
            successTitle="Thank you for volunteering"
          />
        </Reveal>
      </Section>

      <Section tone="sand" aria-labelledby="school-title" id="school-visit">
        <Reveal className="max-w-2xl">
          <SectionHeading
            id="school-title"
            eyebrow="Schools"
            title="Invite us to your school"
            intro="Our Ignite Dreams mentorship visits cover topics chosen for each age group."
            className="mb-6"
          />
          <AppForm
            formType="school-visit"
            fields={schoolVisitFields}
            submitLabel="Request a visit"
            siteKey={siteKey}
            successTitle="Request received"
          />
        </Reveal>
      </Section>

      <Section aria-labelledby="join-title" id="join">
        <Reveal className="max-w-2xl">
          <SectionHeading
            id="join-title"
            eyebrow="Membership"
            title="Join the CBO"
            intro="Membership is open to adult women in our area who support our objectives. The committee reviews each request."
            className="mb-6"
          />
          <AppForm
            formType="join"
            fields={joinFields}
            submitLabel="Send my request"
            siteKey={siteKey}
            successTitle="Request received"
          />
        </Reveal>
      </Section>
    </>
  )
}
