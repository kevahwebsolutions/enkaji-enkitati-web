import { Mail, MapPin, Phone } from 'lucide-react'
import type { Metadata } from 'next'

import { AppForm } from '@/components/forms/AppForm'
import { contactFields } from '@/components/forms/definitions'
import { MapEmbed } from '@/components/contact/MapEmbed'
import { BrandIcon } from '@/components/layout/BrandIcon'
import { SocialIcons } from '@/components/layout/SocialIcons'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal } from '@/components/motion'
import { turnstileSiteKey } from '@/lib/forms/turnstile'
import { getPublicSiteSettings } from '@/lib/site-settings'

export const metadata: Metadata = {
  title: 'Contact us',
  description:
    'Write to Enkaji Enkitati CBO in Narok, Kenya, call or message us on WhatsApp, or send a message through the form.',
  alternates: { canonical: '/contact' },
}

const link =
  'inline-flex min-h-11 items-center gap-3 text-primary-soft underline underline-offset-4'

export default async function ContactPage() {
  const settings = await getPublicSiteSettings()
  const tel = settings.phone.replace(/[^\d+]/g, '')

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch"
        lead="Write to us, call, or send a message through the form. We read every message."
        breadcrumb={[{ label: 'Contact' }]}
      />

      <Section aria-label="Contact">
        <div className="grid gap-12 lg:grid-cols-[22rem_1fr]">
          <Reveal>
            <h2 className="mb-4 font-serif text-2xl font-bold text-primary">Our details</h2>
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
              <li className="flex min-h-11 items-center gap-3 text-ink">
                <MapPin aria-hidden="true" className="size-5 shrink-0 text-accent-ink" />
                {settings.location}
              </li>
            </ul>
            {Object.keys(settings.socials).length > 0 && (
              <>
                <h2 className="mt-8 mb-3 font-serif text-2xl font-bold text-primary">Follow us</h2>
                <SocialIcons socials={settings.socials} orgName={settings.orgName} tone="light" />
              </>
            )}
            <h2 className="mt-8 mb-3 font-serif text-2xl font-bold text-primary">Find us</h2>
            <MapEmbed />
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="mb-4 font-serif text-2xl font-bold text-primary">Send a message</h2>
            <AppForm
              formType="contact"
              fields={contactFields}
              submitLabel="Send message"
              siteKey={turnstileSiteKey()}
              successTitle="Message sent"
            />
          </Reveal>
        </div>
      </Section>
    </>
  )
}
