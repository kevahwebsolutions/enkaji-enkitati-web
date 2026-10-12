import Link from 'next/link'

import { CATEGORIES, newsUrl, type Category } from '@/lib/news-url'
import { cn } from '@/lib/utils'

const chip = (active: boolean) =>
  cn(
    'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-white text-primary hover:border-primary-soft',
  )

/** Category chips. Each keeps the current search term, so category and search combine. */
export function CategoryFilter({ category, q }: { category: Category | undefined; q: string }) {
  return (
    <nav aria-label="Filter by category">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href={newsUrl({ q })}
            aria-current={!category ? 'page' : undefined}
            className={chip(!category)}
          >
            All
          </Link>
        </li>
        {CATEGORIES.map((item) => (
          <li key={item}>
            <Link
              href={newsUrl({ category: item, q })}
              aria-current={category === item ? 'page' : undefined}
              className={chip(category === item)}
            >
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
