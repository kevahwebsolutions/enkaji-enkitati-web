import { Flag } from 'lucide-react'

import { Stagger, StaggerItem } from '@/components/motion'
import { SdgBadge } from '@/components/sections/SdgBadge'
import { sdgName } from '@/lib/sdg'

const kes = new Intl.NumberFormat('en-KE')

/**
 * SDG alignment: a table from 640px up, stacked cards below that so nothing needs sideways
 * scrolling on a phone.
 */
export function SdgAlignment({ rows }: { rows: Array<{ sdg: string; activities: string }> }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-white sm:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            How our activities connect to the Sustainable Development Goals
          </caption>
          <thead className="bg-sand text-primary">
            <tr>
              <th scope="col" className="w-2/5 px-5 py-3 font-serif text-lg">
                Goal
              </th>
              <th scope="col" className="px-5 py-3 font-serif text-lg">
                Our activities
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sdg} className="border-t border-border align-top">
                <th scope="row" className="px-5 py-4 font-semibold text-primary">
                  SDG {row.sdg}
                  <span className="block font-normal text-ink">{sdgName(row.sdg)}</span>
                </th>
                <td className="px-5 py-4 text-ink">{row.activities}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Stagger as="ul" className="grid gap-4 sm:hidden">
        {rows.map((row) => (
          <StaggerItem as="li" key={row.sdg}>
            <div className="rounded-xl border border-border bg-white p-5">
              <SdgBadge number={row.sdg} />
              <p className="mt-3 text-ink">{row.activities}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </>
  )
}

/** Planned projects by program for 2026 to 2030. Plans only: nothing here describes a result. */
export function TargetList({
  targets,
}: {
  targets: Array<{ title: string; description: string | null }>
}) {
  return (
    <Stagger as="ul" className="grid gap-4 md:grid-cols-2">
      {targets.map((target) => (
        <StaggerItem as="li" key={target.title}>
          <div className="flex h-full gap-4 rounded-xl border border-border bg-white p-5">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-bead text-accent-ink">
              <Flag aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h3 className="font-serif text-xl font-bold text-primary">{target.title}</h3>
              {target.description && <p className="mt-1 text-ink">{target.description}</p>}
            </div>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  )
}

/**
 * Horizontal bar chart of the planned annual budget, drawn with plain HTML and CSS (no chart
 * library). Each bar is decorative; the amounts are real text in a list, so the data is readable
 * by screen readers and without styles. Every figure is a plan, never spending.
 */
export function PlanChart({ plan }: { plan: Array<{ objective: string; amountKes: number }> }) {
  const max = Math.max(...plan.map((row) => row.amountKes), 1)
  const total = plan.reduce((sum, row) => sum + row.amountKes, 0)

  return (
    <figure className="rounded-xl border border-border bg-white p-5 sm:p-7">
      <figcaption className="font-serif text-xl font-bold text-primary">
        Planned annual budget (KES)
      </figcaption>
      <ul className="mt-6 space-y-5">
        {plan.map((row) => (
          <li key={row.objective}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="font-semibold text-ink">{row.objective}</span>
              <span className="font-serif text-lg font-bold text-primary">
                KES {kes.format(row.amountKes)}
                <span className="sr-only"> planned</span>
              </span>
            </div>
            <div aria-hidden="true" className="mt-2 h-4 overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max((row.amountKes / max) * 100, 2)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 border-t border-border pt-4 font-semibold text-primary">
        Total planned: KES {kes.format(total)}
      </p>
      <p className="mt-2 text-sm text-ink">
        This is a plan for 2026. It is a budget, not money received or spent.
      </p>
    </figure>
  )
}
