import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

const base =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 font-semibold'

/** Numbered page links with previous and next. Renders nothing when there is one page. */
export function Pagination({
  page,
  totalPages,
  hrefFor,
  label,
}: {
  page: number
  totalPages: number
  hrefFor: (page: number) => string
  label: string
}) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav aria-label={label} className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 && (
          <li>
            <Link
              href={hrefFor(page - 1)}
              rel="prev"
              className={cn(base, 'border border-border bg-white text-primary')}
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              Previous
            </Link>
          </li>
        )}
        {pages.map((number) => (
          <li key={number}>
            <Link
              href={hrefFor(number)}
              aria-current={number === page ? 'page' : undefined}
              aria-label={`Page ${number}`}
              className={cn(
                base,
                number === page
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-white text-primary hover:border-primary-soft',
              )}
            >
              {number}
            </Link>
          </li>
        ))}
        {page < totalPages && (
          <li>
            <Link
              href={hrefFor(page + 1)}
              rel="next"
              className={cn(base, 'border border-border bg-white text-primary')}
            >
              Next
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
