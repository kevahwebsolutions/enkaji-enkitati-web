import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ActivityList, GalleryStrip, ProjectList } from '@/components/programs/ProgramBlocks'
import { TopicTabs, type TopicList } from '@/components/programs/TopicTabs'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { CtaBand } from '@/components/sections/CtaBand'
import { EventCardLink, NamedIcon, PostCardLink } from '@/components/sections/cards'
import { SdgBadge } from '@/components/sections/SdgBadge'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { RichText } from '@/components/ui/RichText'
import { Prose } from '@/components/ui/typography'
import { firstListItems, splitAtH2, withChildren, type TitledSection } from '@/lib/lexical'
import {
  getProgram,
  getProgramEvents,
  getProgramGallery,
  getProgramPosts,
  getProgramSlugs,
} from '@/lib/programs-data'

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  return (await getProgramSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const program = await getProgram(slug)
  if (!program) return { title: 'Program not found' }
  return {
    title: program.meta.title || program.title,
    description: program.meta.description || program.summary,
    alternates: { canonical: `/programs/${program.slug}` },
  }
}

const matches = (section: TitledSection, pattern: RegExp) => pattern.test(section.heading)

export default async function ProgramPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const program = await getProgram(slug)
  if (!program) notFound()

  const [events, posts, gallery] = await Promise.all([
    getProgramEvents(program.id),
    getProgramPosts(program.id),
    getProgramGallery(program.id),
  ])

  // Extra content lives in the body. The mentorship topic lists become tabs; "What we do" prose is
  // used when the program has no activity list; everything else is shown as its own block.
  const body = program.body
  const sections = body ? splitAtH2(body).sections : []
  const primary = sections.find((s) => matches(s, /primary school/i))
  const high = sections.find((s) => matches(s, /high school/i))
  const whatWeDoText = sections.find((s) => matches(s, /^what we do$/i))
  const extras = sections.filter((s) => s !== primary && s !== high && s !== whatWeDoText)

  const topicLists: TopicList[] = [
    primary && { value: 'primary', label: 'Primary school', topics: firstListItems(primary.nodes) },
    high && { value: 'high', label: 'High school', topics: firstListItems(high.nodes) },
  ].filter((list): list is TopicList => Boolean(list && list.topics.length > 0))

  const hasEvents = events.upcoming.length > 0 || events.past.length > 0

  return (
    <>
      <PageHero
        eyebrow="Program"
        title={program.title}
        lead={program.summary}
        icon={<NamedIcon name={program.icon} className="size-7" />}
        breadcrumb={[{ label: 'Programs', href: '/programs' }, { label: program.title }]}
      >
        {program.sdgs.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Sustainable Development Goals">
            {program.sdgs.map((sdg) => (
              <li key={sdg}>
                <SdgBadge number={sdg} className="bg-white ring-1 ring-border" />
              </li>
            ))}
          </ul>
        )}
      </PageHero>

      {program.problem && (
        <Section aria-labelledby="challenge-title">
          <Reveal className="max-w-3xl">
            <SectionHeading
              id="challenge-title"
              eyebrow="Why it matters"
              title="The challenge"
              className="mb-5"
            />
            <p className="text-xl text-ink">{program.problem}</p>
          </Reveal>
        </Section>
      )}

      {(program.activities.length > 0 || whatWeDoText) && (
        <Section tone="sand" aria-labelledby="do-title">
          <Reveal>
            <SectionHeading id="do-title" eyebrow="Our response" title="What we do" />
            {program.activities.length > 0 ? (
              <ActivityList items={program.activities} />
            ) : (
              whatWeDoText &&
              body && (
                <Prose className="text-lg">
                  <RichText data={withChildren(body, whatWeDoText.nodes)} />
                </Prose>
              )
            )}
          </Reveal>
        </Section>
      )}

      {topicLists.length > 0 && (
        <Section aria-labelledby="topics-title">
          <Reveal>
            <SectionHeading
              id="topics-title"
              eyebrow="Ignite Dreams Initiative"
              title="Mentorship topics"
              intro="Each school visit covers topics chosen for the age group."
            />
            <TopicTabs lists={topicLists} />
          </Reveal>
        </Section>
      )}

      {body &&
        extras.map((section, index) => (
          <Section
            key={section.heading}
            tone={index % 2 === 0 ? 'sand' : 'white'}
            aria-labelledby={`extra-${index}`}
          >
            <Reveal className="max-w-3xl">
              <SectionHeading id={`extra-${index}`} title={section.heading} className="mb-5" />
              <Prose className="text-lg">
                <RichText data={withChildren(body, section.nodes)} />
              </Prose>
            </Reveal>
          </Section>
        ))}

      {program.projects.length > 0 && (
        <Section tone="sand" aria-labelledby="projects-title">
          <Reveal>
            <SectionHeading
              id="projects-title"
              eyebrow="Projects"
              title="What we are building"
              intro="The projects this program is built around."
            />
            <ProjectList items={program.projects} />
          </Reveal>
        </Section>
      )}

      {hasEvents && (
        <Section aria-labelledby="events-title">
          <Reveal>
            <SectionHeading
              id="events-title"
              eyebrow="Events"
              title={`Events for ${program.title}`}
              action={{ label: 'All events', href: '/events' }}
            />
          </Reveal>
          {events.upcoming.length > 0 && (
            <div className="mb-10">
              <h3 className="mb-4 font-serif text-xl font-bold text-primary">Upcoming</h3>
              <Stagger as="ul" className="grid gap-6 md:grid-cols-3">
                {events.upcoming.map((event) => (
                  <StaggerItem as="li" key={event.id}>
                    <EventCardLink event={event} />
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          )}
          {events.past.length > 0 && (
            <div>
              <h3 className="mb-4 font-serif text-xl font-bold text-primary">Past</h3>
              <Stagger as="ul" className="grid gap-6 md:grid-cols-3">
                {events.past.map((event) => (
                  <StaggerItem as="li" key={event.id}>
                    <EventCardLink event={event} />
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          )}
        </Section>
      )}

      {posts.length > 0 && (
        <Section tone="sand" aria-labelledby="posts-title">
          <Reveal>
            <SectionHeading
              id="posts-title"
              eyebrow="News and stories"
              title="From this program"
              action={{ label: 'All news', href: '/news' }}
            />
          </Reveal>
          <Stagger as="ul" className="grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <StaggerItem as="li" key={post.id}>
                <PostCardLink post={post} />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      )}

      {gallery.length > 0 && (
        <Section aria-labelledby="gallery-title">
          <Reveal>
            <SectionHeading
              id="gallery-title"
              eyebrow="Gallery"
              title="In pictures"
              action={{ label: 'All galleries', href: '/gallery' }}
            />
            <GalleryStrip images={gallery} />
          </Reveal>
        </Section>
      )}

      <CtaBand
        title="Fund this program"
        text={`Give toward ${program.title}, or partner with us to grow it.`}
        donate={{ label: 'Fund this program', href: `/donate?program=${program.slug}` }}
        secondary={{ label: 'Get involved', href: '/get-involved' }}
      />
    </>
  )
}
