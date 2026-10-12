'use client'

import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { newsUrl, type Category } from '@/lib/news-url'

const DEBOUNCE_MS = 350

/**
 * Search box for the news list. Typing searches after a short pause (debounced); pressing Enter or
 * the button searches at once. Without JavaScript it is an ordinary GET form, so it still works.
 */
export function NewsSearch({
  initialQuery,
  category,
}: {
  initialQuery: string
  category: Category | undefined
}) {
  const router = useRouter()
  const [value, setValue] = useState(initialQuery)
  const [pending, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const go = (q: string) => {
    clearTimeout(timer.current)
    startTransition(() => router.replace(newsUrl({ category, q }), { scroll: false }))
  }

  const onChange = (next: string) => {
    setValue(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => go(next), DEBOUNCE_MS)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    go(value)
  }

  return (
    <form
      action="/news"
      method="get"
      role="search"
      onSubmit={onSubmit}
      aria-busy={pending}
      className="flex w-full max-w-xl gap-2"
    >
      {category && <input type="hidden" name="category" value={category} />}
      <div className="relative flex-1">
        <label htmlFor="news-search" className="sr-only">
          Search news and stories
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id="news-search"
          name="q"
          type="search"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search news and stories"
          className="h-11 w-full rounded-lg border border-border bg-white pr-11 pl-10 text-base text-ink [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue('')
              go('')
            }}
            className="absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-primary hover:bg-sand"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>
      <Button type="submit">Search</Button>
    </form>
  )
}
