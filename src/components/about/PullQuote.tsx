import { Quote } from 'lucide-react'

/** Large serif quotation set apart from the article text. It repeats a line from the article. */
export function PullQuote({ children }: { children: string }) {
  return (
    <figure className="my-10 border-y-2 border-accent py-8 text-center">
      <Quote aria-hidden="true" className="mx-auto mb-4 size-8 text-accent-ink" />
      <blockquote className="font-serif text-2xl leading-snug font-bold text-balance text-primary sm:text-3xl">
        {children}
      </blockquote>
    </figure>
  )
}
