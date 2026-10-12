import { CalendarPlus, Download } from 'lucide-react'

import { Stagger, StaggerItem } from '@/components/motion'
import { Button } from '@/components/ui/button'
import type { EventDetail } from '@/lib/events-data'

const kes = new Intl.NumberFormat('en-KE')

/** Vertical timeline of the programme. Times are free text, for example "9:00 am". */
export function AgendaTimeline({ agenda }: { agenda: EventDetail['agenda'] }) {
  return (
    <ol className="relative space-y-6 border-l-2 border-accent pl-6">
      {agenda.map((item, index) => (
        <li key={`${item.title}-${index}`} className="relative">
          <span
            aria-hidden="true"
            className="absolute top-1.5 -left-[2.1rem] size-4 rounded-full border-4 border-white bg-primary"
          />
          {item.time && (
            <p className="font-serif text-sm font-bold tracking-[0.15em] text-accent-ink uppercase">
              {item.time}
            </p>
          )}
          <h3 className="font-serif text-xl font-bold text-primary">{item.title}</h3>
          {item.description && <p className="mt-1 text-ink">{item.description}</p>}
        </li>
      ))}
    </ol>
  )
}

/** Sponsorship tier cards. Amounts are minimums for sponsoring this event. */
export function SponsorTiers({ tiers }: { tiers: EventDetail['sponsorTiers'] }) {
  return (
    <Stagger as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiers.map((tier) => (
        <StaggerItem as="li" key={tier.name}>
          <div className="flex h-full flex-col gap-2 rounded-xl border border-border bg-white p-5">
            <h3 className="font-serif text-xl font-bold text-primary">{tier.name}</h3>
            <p className="font-serif text-2xl font-bold text-accent-ink">
              KES {kes.format(tier.minimumKes)}+
            </p>
            {tier.benefits && <p className="text-ink">{tier.benefits}</p>}
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  )
}

/** Download an .ics file (works with Apple, Outlook and Google) or open Google Calendar directly. */
export function AddToCalendar({ icsHref, googleHref }: { icsHref: string; googleHref: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild variant="outline">
        <a href={icsHref} download>
          <Download aria-hidden="true" /> Download .ics
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href={googleHref} target="_blank" rel="noopener noreferrer">
          <CalendarPlus aria-hidden="true" /> Google Calendar
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </Button>
    </div>
  )
}
