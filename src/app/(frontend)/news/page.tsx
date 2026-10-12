import type { Metadata } from 'next'
import Link from 'next/link'

import { Pagination } from '@/components/events/Pagination'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Stagger, StaggerItem } from '@/components/motion'
import { CategoryFilter } from '@/components/news/CategoryFilter'
import { NewsSearch } from '@/components/news/NewsSearch'
import { PostCardLink } from '@/components/sections/cards'
import { getNewsPage } from '@/lib/news-data'
import { isCategory, newsUrl } from '@/lib/news-url'

type SearchParams = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const params = await searchParams
  const category = first(params.category)
  const q = first(params.q)?.trim()
  const page = Math.max(Number.parseInt(first(params.page) ?? '1', 10) || 1, 1)
  return {
    title: isCategory(category) ? `${category} news` : 'News and stories',
    description:
      'News, stories, press and reports from Enkaji Enkitati CBO in Ewaso Ng’iro, Narok County.',
    // Searches are not indexed; categories and pages are, each with its own canonical address.
    alternates: {
      canonical: newsUrl({ category: isCategory(category) ? category : undefined, page }),
      types: { 'application/rss+xml': '/news/rss.xml' },
    },
    robots: q ? { index: false, follow: true } : undefined,
  }
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const categoryParam = first(params.category)
  const category = isCategory(categoryParam) ? categoryParam : undefined
  const q = first(params.q)?.trim().slice(0, 100) ?? ''
  const requestedPage = Math.max(Number.parseInt(first(params.page) ?? '1', 10) || 1, 1)

  const { posts, total, totalPages, page } = await getNewsPage({ category, q, page: requestedPage })
  const filtered = Boolean(category || q)

  return (
    <>
      <PageHero
        eyebrow="News and stories"
        title="From the community"
        lead="News, stories, press and reports from Ewaso Ng’iro."
        breadcrumb={[{ label: 'News' }]}
      />

      <Section aria-label="News">
        <div className="space-y-5">
          <NewsSearch initialQuery={q} category={category} />
          <CategoryFilter category={category} q={q} />
        </div>

        <p role="status" className="mt-6 text-ink">
          {q
            ? `${total} ${total === 1 ? 'result' : 'results'} for “${q}”${category ? ` in ${category}` : ''}.`
            : category
              ? `${total} ${total === 1 ? 'post' : 'posts'} in ${category}.`
              : `${total} ${total === 1 ? 'post' : 'posts'}.`}
        </p>

        <div className="mt-6">
          {posts.length > 0 ? (
            <>
              <Stagger as="ul" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <StaggerItem as="li" key={post.id}>
                    <PostCardLink post={post} />
                  </StaggerItem>
                ))}
              </Stagger>
              <Pagination
                page={page}
                totalPages={totalPages}
                label="News pages"
                hrefFor={(target) => newsUrl({ category, q, page: target })}
              />
            </>
          ) : (
            <div className="max-w-2xl rounded-xl border border-border bg-white p-6">
              <p className="text-lg text-ink">
                {filtered
                  ? 'No posts match. Try a different word or category.'
                  : 'No posts have been published yet.'}
              </p>
              {filtered && (
                <p className="mt-3">
                  <Link
                    href="/news"
                    className="font-semibold text-primary-soft underline underline-offset-4"
                  >
                    Show all posts
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>

        <p className="mt-10 text-sm text-ink">
          <Link
            href="/news/rss.xml"
            className="inline-flex min-h-11 items-center font-semibold text-primary-soft underline underline-offset-4"
          >
            Subscribe with RSS
          </Link>
        </p>
      </Section>
    </>
  )
}
