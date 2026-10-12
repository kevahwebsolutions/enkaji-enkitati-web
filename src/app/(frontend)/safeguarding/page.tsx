import type { Metadata } from 'next'

import { LegalPage } from '@/components/layout/LegalPage'
import { getPage } from '@/lib/about-data'
import { pageMetadata } from '@/lib/page-parts'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage('safeguarding'), {
    title: 'Child safeguarding and image consent',
    description: 'How Enkaji Enkitati CBO protects children and handles photos, names and stories.',
    path: '/safeguarding',
  })
}

export default function Page() {
  return <LegalPage slug="safeguarding" fallbackEyebrow="Protecting children" />
}
