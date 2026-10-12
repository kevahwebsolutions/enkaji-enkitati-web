import type { Metadata } from 'next'

import { AppForm } from '@/components/forms/AppForm'
import { newsletterFields } from '@/components/forms/definitions'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { turnstileSiteKey } from '@/lib/forms/turnstile'

export const metadata: Metadata = {
  title: 'Newsletter',
  description: 'Get news from Enkaji Enkitati CBO by email.',
  robots: { index: false, follow: true },
}

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const email = Array.isArray(params.email) ? params.email[0] : params.email

  return (
    <>
      <PageHero
        eyebrow="Newsletter"
        title="News in your inbox"
        lead="Occasional news and stories from Enkaji Enkitati CBO. We email you a link to confirm, and every message has an unsubscribe link."
        breadcrumb={[{ label: 'Newsletter' }]}
      />
      <Section aria-label="Subscribe">
        <div className="max-w-xl">
          <AppForm
            formType="newsletter"
            fields={newsletterFields}
            submitLabel="Subscribe"
            siteKey={turnstileSiteKey()}
            defaultValues={{ email: email?.slice(0, 200) ?? '' }}
            successTitle="Check your email"
            consentLabel="I agree to receive news from Enkaji Enkitati CBO by email."
          />
        </div>
      </Section>
    </>
  )
}
