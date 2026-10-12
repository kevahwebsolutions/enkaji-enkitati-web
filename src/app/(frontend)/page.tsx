import type { Metadata } from 'next'

import { CtaBand } from '@/components/sections/CtaBand'
import { Hero } from '@/components/sections/Hero'
import { LatestStories } from '@/components/sections/LatestStories'
import { PartnerLogos } from '@/components/sections/PartnerLogos'
import { ProgramGrid } from '@/components/sections/ProgramGrid'
import { SdgStrip } from '@/components/sections/SdgStrip'
import { UpcomingEvents } from '@/components/sections/UpcomingEvents'
import { WhereWeWork } from '@/components/sections/WhereWeWork'
import { WhoWeAre } from '@/components/sections/WhoWeAre'
import {
  getHomeContent,
  getHomePrograms,
  getLatestPosts,
  getNextCalendarDates,
  getPartnerLogos,
  getUpcomingEvents,
} from '@/lib/home-data'

// CMS publishes purge the cache by tag. The hourly window lets "upcoming" move on as dates pass.
export const revalidate = 3600

export const metadata: Metadata = {
  title: { absolute: 'Enkaji Enkitati CBO | Empowering Women, Sustaining Futures' },
  description:
    'A women-led community organization in Ewaso Ng’iro, Narok County, Kenya, working on savings groups, girls’ dignity and health, education and mentorship, community development and support for vulnerable households.',
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const [content, programs, events, posts, partners] = await Promise.all([
    getHomeContent(),
    getHomePrograms(),
    getUpcomingEvents(),
    getLatestPosts(),
    getPartnerLogos(),
  ])
  const calendar = events.length === 0 ? getNextCalendarDates() : []

  return (
    <>
      <Hero content={content} />
      <WhoWeAre content={content} />
      <ProgramGrid programs={programs} />
      <WhereWeWork content={content} />
      <UpcomingEvents events={events} calendar={calendar} />
      <LatestStories posts={posts} />
      <SdgStrip goals={content.sdgStrip} />
      <PartnerLogos partners={partners} />
      <CtaBand />
    </>
  )
}
