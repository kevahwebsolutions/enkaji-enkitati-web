import { Heart } from 'lucide-react'
import Link from 'next/link'

import { Container } from '@/components/layout/Container'
import { Reveal } from '@/components/motion'
import { Button } from '@/components/ui/button'
import { H2 } from '@/components/ui/typography'

type CtaBandProps = {
  title?: string
  text?: string
  donate?: { label: string; href: string }
  secondary?: { label: string; href: string } | null
}

/** Green call-to-action band that closes a page. The defaults are the site-wide get involved band. */
export function CtaBand({
  title = 'Stand with women and girls in Narok',
  text = 'Volunteer your time, partner with us or give. Every shilling and every hour goes to savings groups, girls’ dignity and families who need a hand.',
  donate = { label: 'Donate', href: '/donate' },
  secondary = { label: 'Get involved', href: '/get-involved' },
}: CtaBandProps) {
  return (
    <section aria-labelledby="cta-title" className="bg-primary">
      <Container className="py-14 sm:py-16">
        <Reveal className="max-w-3xl">
          <H2 id="cta-title" tone="inverse">
            {title}
          </H2>
          <p className="mt-3 text-lg text-sand">{text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="donate" size="lg">
              <Link href={donate.href}>
                <Heart aria-hidden="true" /> {donate.label}
              </Link>
            </Button>
            {secondary && (
              <Button asChild variant="inverse" size="lg">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
