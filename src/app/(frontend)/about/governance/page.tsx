import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DocumentList } from '@/components/about/DocumentList'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { ExtraBlocks } from '@/components/sections/ExtraBlocks'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { RichText } from '@/components/ui/RichText'
import { Prose } from '@/components/ui/typography'
import { getDocuments, getPage } from '@/lib/about-data'
import { splitAtH2, withChildren } from '@/lib/lexical'
import { pageMetadata, pageParts } from '@/lib/page-parts'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage('governance'), {
    title: 'Governance and accountability',
    description:
      'How Enkaji Enkitati CBO is governed: an elected committee, monthly meetings, two signatures on every withdrawal and a regular reporting cycle.',
    path: '/about/governance',
  })
}

export default async function GovernancePage() {
  const [page, documents] = await Promise.all([getPage('governance'), getDocuments()])
  if (!page) notFound()
  const { hero, texts, extras } = pageParts(page)
  const [content] = texts
  const { intro, sections } = content ? splitAtH2(content) : { intro: [], sections: [] }

  return (
    <>
      <PageHero
        eyebrow={hero?.eyebrow ?? 'Accountability'}
        title={hero?.heading ?? page.title}
        lead={hero?.subheading ?? undefined}
        breadcrumb={[{ label: 'About', href: '/about' }, { label: 'Governance' }]}
      />

      {content && (
        <Section aria-labelledby="governance-title">
          <Reveal>
            <SectionHeading
              id="governance-title"
              eyebrow="Our rules"
              title="Committee, money and reporting"
            />
            {intro.length > 0 && (
              <Prose className="mb-8 text-lg">
                <RichText data={withChildren(content, intro)} />
              </Prose>
            )}
          </Reveal>
          <Stagger as="div" className="grid gap-6 md:grid-cols-2">
            {sections.map((section) => (
              <StaggerItem key={section.heading}>
                <div className="h-full rounded-xl border border-border bg-white p-6">
                  <h3 className="font-serif text-2xl font-bold text-primary">{section.heading}</h3>
                  <Prose className="mt-3">
                    <RichText data={withChildren(content, section.nodes)} />
                  </Prose>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      )}

      {documents.length > 0 && (
        <Section tone="sand" aria-labelledby="documents-title">
          <Reveal>
            <SectionHeading
              id="documents-title"
              eyebrow="Download"
              title="Reports and documents"
              intro="Our constitution, profile and reports, as PDF files."
            />
            <DocumentList documents={documents} />
          </Reveal>
        </Section>
      )}

      <ExtraBlocks blocks={extras} />
    </>
  )
}
