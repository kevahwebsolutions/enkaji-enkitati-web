import Image from 'next/image'

import { Section } from '@/components/layout/Section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import type { PartnerLogo } from '@/lib/home-data'

import { SectionHeading } from './SectionHeading'

/** Logo row. It renders nothing until at least one partner with a logo has been added in the CMS. */
export function PartnerLogos({ partners }: { partners: PartnerLogo[] }) {
  if (partners.length === 0) return null

  return (
    <Section aria-labelledby="partners-title" className="py-10 sm:py-12">
      <Reveal>
        <SectionHeading
          id="partners-title"
          eyebrow="Together"
          title="Our partners"
          className="mb-6"
        />
      </Reveal>
      <Stagger as="ul" className="flex flex-wrap items-center gap-x-10 gap-y-6">
        {partners.map((partner) => {
          const logo = (
            <Image
              src={partner.logo.url}
              alt={partner.name}
              width={partner.logo.width}
              height={partner.logo.height}
              sizes="160px"
              className="h-14 w-auto max-w-40 object-contain"
            />
          )
          return (
            <StaggerItem as="li" key={partner.id}>
              {partner.url ? (
                <a
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center"
                >
                  {logo}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                logo
              )}
            </StaggerItem>
          )
        })}
      </Stagger>
    </Section>
  )
}
