import type { Metadata } from 'next'

import { LegalPage } from '@/components/layout/LegalPage'
import { getPage } from '@/lib/about-data'
import { pageMetadata } from '@/lib/page-parts'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage('terms'), {
    title: 'Terms of use',
    description: 'The terms for using the Enkaji Enkitati CBO website.',
    path: '/terms',
  })
}

export default function Page() {
  return <LegalPage slug="terms" fallbackEyebrow="Using this site" />
}
