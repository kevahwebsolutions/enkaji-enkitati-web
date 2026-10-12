import type { Metadata } from 'next'

import { LegalPage } from '@/components/layout/LegalPage'
import { getPage } from '@/lib/about-data'
import { pageMetadata } from '@/lib/page-parts'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage('privacy'), {
    title: 'Privacy notice',
    description:
      "How Enkaji Enkitati CBO collects, uses and protects your information under Kenya's Data Protection Act, 2019.",
    path: '/privacy',
  })
}

export default function Page() {
  return <LegalPage slug="privacy" fallbackEyebrow="Your information" />
}
