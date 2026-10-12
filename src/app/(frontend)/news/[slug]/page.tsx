import { Clock, UserRound } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { ShareButtons } from '@/components/news/ShareButtons'
import { PostCardLink } from '@/components/sections/cards'
import { SectionHeading } from '@/components/sections/SectionHeading'
import { RichText } from '@/components/ui/RichText'
import { Prose } from '@/components/ui/typography'
import { siteUrl } from '@/lib/event-time'
import { formatLongDate } from '@/lib/format'
import { articleJsonLd, jsonLd } from '@/lib/jsonld'
import { getPost, getPostSlugs, getRelatedPosts } from '@/lib/news-data'
import { newsUrl } from '@/lib/news-url'
import { getPublicSiteSettings } from '@/lib/site-settings'

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  return (await getPostSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Post not found' }
  const url = `${siteUrl()}/news/${post.slug}`
  const description = post.meta.description || post.excerpt
  return {
    title: post.meta.title || post.title,
    description,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      type: 'article',
      url,
      title: post.meta.title || post.title,
      description,
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      images: [{ url: post.cover?.url ?? '/brand/og-default.png' }],
    },
  }
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const [related, settings] = await Promise.all([
    getRelatedPosts(
      post.id,
      post.programs.map((program) => program.id),
    ),
    getPublicSiteSettings(),
  ])
  const url = `${siteUrl()}/news/${post.slug}`

  const structuredData = articleJsonLd({
    headline: post.title,
    url,
    description: post.excerpt,
    publishedAt: post.publishedAt,
    modifiedAt: post.updatedAt,
    imageUrl: post.cover ? `${siteUrl()}${post.cover.url}` : `${siteUrl()}/brand/og-default.png`,
    authorName: post.author?.name ?? null,
    orgName: settings.orgName,
    orgUrl: siteUrl(),
    logoUrl: `${siteUrl()}/brand/icon-512.png`,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />

      <PageHero
        eyebrow={post.category}
        title={post.title}
        lead={post.excerpt}
        breadcrumb={[{ label: 'News', href: '/news' }, { label: post.title }]}
      >
        <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-ink">
          {post.publishedAt && (
            <time dateTime={post.publishedAt} className="font-semibold">
              {formatLongDate(post.publishedAt)}
            </time>
          )}
          <span className="inline-flex items-center gap-2">
            <Clock aria-hidden="true" className="size-4 text-accent-ink" />
            {post.readingMinutes} min read
          </span>
          {post.author && (
            <span className="inline-flex items-center gap-2">
              <UserRound aria-hidden="true" className="size-4 text-accent-ink" />
              By {post.author.name}
            </span>
          )}
        </p>
      </PageHero>

      <Section aria-label="Story">
        <article className="mx-auto max-w-3xl">
          {post.cover && (
            <Image
              src={post.cover.url}
              alt={post.cover.alt}
              width={post.cover.width}
              height={post.cover.height}
              sizes="(min-width: 768px) 768px, 100vw"
              priority
              className="mb-10 h-auto w-full rounded-xl"
            />
          )}
          {post.body && (
            <Prose className="max-w-none text-lg">
              <RichText data={post.body} />
            </Prose>
          )}

          {post.programs.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-2 font-serif text-lg font-bold text-primary">Related programs</h2>
              <ul className="flex flex-wrap gap-2">
                {post.programs.map((program) => (
                  <li key={program.slug}>
                    <Link
                      href={`/programs/${program.slug}`}
                      className="inline-flex min-h-11 items-center rounded-full bg-bead px-4 text-sm font-semibold text-primary hover:bg-[#e6d9b4]"
                    >
                      {program.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 border-t border-border pt-6">
            <h2 className="mb-3 font-serif text-lg font-bold text-primary">Share this story</h2>
            <ShareButtons url={url} title={post.title} />
          </div>
        </article>
      </Section>

      {related.length > 0 && (
        <Section tone="sand" aria-labelledby="related-title">
          <Reveal>
            <SectionHeading
              id="related-title"
              eyebrow="Keep reading"
              title="Related stories"
              action={{ label: 'All news', href: newsUrl() }}
            />
          </Reveal>
          <Stagger as="ul" className="grid gap-6 md:grid-cols-3">
            {related.map((item) => (
              <StaggerItem as="li" key={item.id}>
                <PostCardLink post={item} />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      )}
    </>
  )
}
