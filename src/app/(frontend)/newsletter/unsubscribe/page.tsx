import type { Metadata } from 'next'

import { unsubscribeAction } from '@/app/actions/newsletter'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const token = Array.isArray(params.t) ? params.t[0] : params.t

  return (
    <>
      <PageHero
        eyebrow="Newsletter"
        title="Unsubscribe"
        lead="Stop emails from Enkaji Enkitati CBO."
      />
      <Section aria-label="Unsubscribe">
        {token ? (
          <form action={unsubscribeAction} className="max-w-xl space-y-4">
            <input type="hidden" name="t" value={token} />
            <p className="text-lg text-ink">
              Press the button to stop receiving our newsletter. We keep only your address, marked
              as unsubscribed, so we never email you again by mistake.
            </p>
            <Button type="submit" size="lg">
              Unsubscribe me
            </Button>
          </form>
        ) : (
          <p className="max-w-xl text-lg text-ink">
            This link is incomplete. Use the unsubscribe link from one of our emails, or write to
            info@enkajienkitaticbo.org and we will remove you.
          </p>
        )}
      </Section>
    </>
  )
}
