import { Landmark, Smartphone } from 'lucide-react'
import type { ReactNode } from 'react'

import { CopyButton } from '@/components/donate/CopyButton'
import { hasBank, hasMpesa, type PaymentDetails } from '@/lib/site-settings'

function Row({ label, value, copy }: { label: string; value: string | null; copy?: boolean }) {
  if (!value) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border py-3 first:border-t-0">
      <dt className="font-semibold text-primary">{label}</dt>
      <dd className="flex items-center gap-3 text-ink">
        <span className="font-mono text-lg tracking-wide break-all">{value}</span>
        {copy && <CopyButton value={value} label={label} />}
      </dd>
    </div>
  )
}

function Card({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 sm:p-6">
      <h3 className="flex items-center gap-3 font-serif text-2xl font-bold text-primary">
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-bead text-accent-ink">
          {icon}
        </span>
        {title}
      </h3>
      <dl className="mt-3">{children}</dl>
    </div>
  )
}

/** M-PESA and bank blocks. Only the values an admin has filled in are shown. */
export function PaymentBlocks({ details }: { details: PaymentDetails }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {hasMpesa(details) && (
        <Card icon={<Smartphone aria-hidden="true" className="size-5" />} title="M-PESA">
          <Row label="Paybill business number" value={details.paybill} copy />
          {details.paybill && (
            <Row label="Account reference" value={details.accountReference} copy />
          )}
          <Row label="Till number" value={details.till} copy />
        </Card>
      )}
      {hasBank(details) && (
        <Card icon={<Landmark aria-hidden="true" className="size-5" />} title="Bank transfer">
          <Row label="Bank" value={details.bankName} />
          <Row label="Branch" value={details.bankBranch} />
          <Row label="Account name" value={details.accountName} copy />
          <Row label="Account number" value={details.accountNumber} copy />
        </Card>
      )}
    </div>
  )
}
