import { Section } from '@/components/layout/Section'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import type { PostCard } from '@/lib/home-data'

import { PostCardLink } from './cards'
import { SectionHeading } from './SectionHeading'

export function LatestStories({ posts }: { posts: PostCard[] }) {
  if (posts.length === 0) return null

  return (
    <Section aria-labelledby="stories-title">
      <Reveal>
        <SectionHeading
          id="stories-title"
          eyebrow="News and stories"
          title="Latest from the community"
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
  )
}
