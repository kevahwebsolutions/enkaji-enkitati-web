import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PullQuote } from '@/components/about/PullQuote'
import { Avatar } from '@/components/about/LeaderCard'
import { Container } from '@/components/layout/Container'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal } from '@/components/motion'
import { ExtraBlocks } from '@/components/sections/ExtraBlocks'
import { Button } from '@/components/ui/button'
import { RichText } from '@/components/ui/RichText'
import { getPage } from '@/lib/about-data'
import { rootChildren, stateText, withChildren, type LexicalState } from '@/lib/lexical'
import { pageMetadata, pageParts } from '@/lib/page-parts'

const QUOTE = /change begins with courage, and courage begins with a single voice/i

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage('founder'), {
    title: "Founder's story",
    description:
      'My Story as a Young Maasai Girl, by Caren Naeku Dapash, founder and chairperson of Enkaji Enkitati CBO.',
    path: '/about/founder',
  })
}

/** The article, with a pull quote set in the middle when the story contains the line. */
function Article({ story }: { story: LexicalState }) {
  const nodes = rootChildren(story)
  const hasQuote = QUOTE.test(stateText(story))
  const middle = Math.floor(nodes.length / 2)

  if (!hasQuote || nodes.length < 4) {
    return <RichText data={story} className="prose-longform dropcap" />
  }
  return (
    <>
      <RichText
        data={withChildren(story, nodes.slice(0, middle))}
        className="prose-longform dropcap"
      />
      <PullQuote>Change begins with courage, and courage begins with a single voice.</PullQuote>
      <RichText data={withChildren(story, nodes.slice(middle))} className="prose-longform" />
    </>
  )
}

export default async function FounderPage() {
  const page = await getPage('founder')
  if (!page) notFound()
  const { hero, texts, extras } = pageParts(page)
  const [story, bio] = texts
  const author = hero?.subheading?.replace(/^By\s+/i, '') ?? 'Caren Naeku Dapash'

  return (
    <>
      <PageHero
        eyebrow={hero?.eyebrow ?? "Founder's story"}
        title={hero?.heading ?? page.title}
        lead={hero?.subheading ?? undefined}
        breadcrumb={[{ label: 'About', href: '/about' }, { label: "Founder's story" }]}
      />

      {story && (
        <Section aria-label="Story">
          <Reveal>
            <article>
              <Article story={story} />
            </article>
          </Reveal>
        </Section>
      )}

      {bio && (
        <Section tone="sand" aria-label={`About ${author}`} className="py-10 sm:py-14">
          <Container className="max-w-3xl">
            <Reveal>
              <div className="flex flex-col gap-6 rounded-xl border border-border bg-white p-6 sm:flex-row sm:p-8">
                <Avatar name={author} className="size-24 text-3xl" />
                <div>
                  <RichText data={bio} className="prose-enkaji" />
                  <Button asChild variant="outline" className="mt-6">
                    <Link href="/about/leadership">Meet the leadership</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </Container>
        </Section>
      )}

      <ExtraBlocks blocks={extras} />
    </>
  )
}
