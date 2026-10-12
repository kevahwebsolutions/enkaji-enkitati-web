import type { Metadata } from 'next'
import Link from 'next/link'

import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Newsletter',
  robots: { index: false, follow: false },
}

const MESSAGES: Record<string, { title: string; text: string }> = {
  confirmed: {
    title: 'You are subscribed',
    text: 'Thank you. Your address is confirmed and you will receive news from Enkaji Enkitati CBO.',
  },
  already: {
    title: 'Already confirmed',
    text: 'This address is already confirmed. There is nothing more to do.',
  },
  expired: {
    title: 'This link has expired',
    text: 'Confirmation links work for 7 days. Please sign up again and we will send a new one.',
  },
  invalid: {
    title: 'This link does not work',
    text: 'The link is incomplete or has been replaced by a newer one. Please sign up again, or write to info@enkajienkitaticbo.org.',
  },
  unsubscribed: {
    title: 'You are unsubscribed',
    text: 'You will not receive our newsletter. You can sign up again at any time.',
  },
}

export default async function NewsletterStatusPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const state = Array.isArray(params.state) ? params.state[0] : params.state
  const message = MESSAGES[state ?? ''] ?? MESSAGES.invalid

  return (
    <>
      <PageHero eyebrow="Newsletter" title={message.title} />
      <Section aria-label="Result">
        <p role="status" className="max-w-xl text-lg text-ink">
          {message.text}
        </p>
        <Button asChild variant="outline" className="mt-8">
          <Link href="/">Back to the home page</Link>
        </Button>
      </Section>
    </>
  )
}
