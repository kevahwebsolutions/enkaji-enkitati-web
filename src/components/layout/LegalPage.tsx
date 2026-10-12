import { notFound } from 'next/navigation'

import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { ExtraBlocks } from '@/components/sections/ExtraBlocks'
import { RichText } from '@/components/ui/RichText'
import { Prose } from '@/components/ui/typography'
import { getPage } from '@/lib/about-data'
import { pageParts } from '@/lib/page-parts'

/** A standalone legal page (privacy, terms, safeguarding) written in the CMS under Pages. */
export async function LegalPage({
  slug,
  fallbackEyebrow,
}: {
  slug: string
  fallbackEyebrow: string
}) {
  const page = await getPage(slug)
  if (!page) notFound()
  const { hero, texts, extras } = pageParts(page)

  return (
    <>
      <PageHero
        eyebrow={hero?.eyebrow ?? fallbackEyebrow}
        title={hero?.heading ?? page.title}
        lead={hero?.subheading ?? undefined}
      />
      <Section aria-label={page.title}>
        <div className="max-w-3xl space-y-8">
          {texts.map((text, index) => (
            <Prose key={index} className="text-lg">
              <RichText data={text} />
            </Prose>
          ))}
        </div>
      </Section>
      <ExtraBlocks blocks={extras} />
    </>
  )
}
