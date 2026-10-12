import { Mail, Phone } from 'lucide-react'
import type { Metadata } from 'next'

import { PaymentBlocks } from '@/components/donate/PaymentBlocks'
import { AppForm } from '@/components/forms/AppForm'
import { pledgeFields } from '@/components/forms/definitions'
import { BrandIcon } from '@/components/layout/BrandIcon'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal } from '@/components/motion'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { turnstileSiteKey } from '@/lib/forms/turnstile'
import { getPrograms } from '@/lib/programs-data'
import { getPaymentDetails, getPublicSiteSettings } from '@/lib/site-settings'

export const metadata: Metadata = {
  title: 'Donate',
  description:
    'Give to Enkaji Enkitati CBO by M-PESA or bank transfer, or make a pledge and we will contact you.',
  alternates: { canonical: '/donate' },
}

const link =
  'inline-flex min-h-11 items-center gap-3 text-primary-soft underline underline-offset-4'

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const [programs, payment, settings] = await Promise.all([
    getPrograms(),
    getPaymentDetails(),
    getPublicSiteSettings(),
  ])
  const requested = Array.isArray(params.program) ? params.program[0] : params.program
  const program = programs.find((item) => item.slug === requested)?.slug ?? ''
  const tel = settings.phone.replace(/[^\d+]/g, '')

  return (
    <>
      <PageHero
        eyebrow="Donate"
        title="Give to women and girls"
        lead={
          payment
            ? 'Give by M-PESA or bank transfer using the details below, then tell us with a pledge so we can thank you. A pledge on its own takes no money from you.'
            : 'Make a pledge and we will contact you about how to give. A pledge takes no money from you.'
        }
        breadcrumb={[{ label: 'Donate' }]}
      />

      {payment ? (
        <Section tone="sand" aria-labelledby="pay-title">
          <Reveal>
            <SectionHeading
              id="pay-title"
              eyebrow="Ways to give"
              title="Payment details"
              intro="Use the copy buttons to avoid typing mistakes."
            />
            <PaymentBlocks details={payment} />
          </Reveal>
        </Section>
      ) : (
        <Section tone="sand" aria-labelledby="soon-title">
          <Reveal className="max-w-2xl">
            <SectionHeading
              id="soon-title"
              eyebrow="Ways to give"
              title="Online giving is coming soon"
              intro="We are setting up our payment accounts. Until then, send a pledge below, or reach us directly."
            />
            <ul className="space-y-1">
              <li>
                <a href={`mailto:${settings.email}`} className={link}>
                  <Mail aria-hidden="true" className="size-5 shrink-0 text-accent-ink" />
                  {settings.email}
                </a>
              </li>
              <li>
                <a href={`tel:${tel}`} className={link}>
                  <Phone aria-hidden="true" className="size-5 shrink-0 text-accent-ink" />
                  {settings.phone}
                </a>
              </li>
              {settings.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${settings.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={link}
                  >
                    <BrandIcon name="whatsapp" className="size-5 shrink-0 text-accent-ink" />
                    WhatsApp us<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              )}
            </ul>
          </Reveal>
        </Section>
      )}

      <Section aria-labelledby="pledge-title" id="pledge">
        <Reveal className="max-w-2xl">
          <SectionHeading
            id="pledge-title"
            eyebrow="Pledge"
            title="Make a pledge"
            intro={
              payment
                ? 'Tell us what you gave or plan to give, and choose a program if you wish to direct it.'
                : 'Choose a program if you wish to direct your gift.'
            }
            className="mb-6"
          />
          <AppForm
            formType="pledge"
            fields={pledgeFields(programs)}
            submitLabel="Send my pledge"
            siteKey={turnstileSiteKey()}
            defaultValues={{ program }}
            successTitle="Thank you for your pledge"
            consentLabel="I agree that Enkaji Enkitati CBO may use these details to contact me about my pledge."
          />
        </Reveal>
      </Section>
    </>
  )
}
