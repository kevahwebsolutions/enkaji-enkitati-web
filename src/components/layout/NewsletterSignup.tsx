import { Button } from '@/components/ui/button'

/**
 * Footer newsletter field. It is a plain form that sends the address to /newsletter, where the
 * visitor ticks the consent box, passes the human check and receives the confirmation email
 * (double opt-in). Nothing is subscribed from the footer alone, and it adds no JavaScript to the page.
 */
export function NewsletterSignup() {
  return (
    <form action="/newsletter" method="get" aria-describedby="newsletter-note">
      <label htmlFor="newsletter-email" className="block text-sm font-semibold text-sand">
        Email address
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-11 w-full min-w-0 rounded-lg border border-sand/40 bg-sand px-3 text-base text-ink placeholder:text-muted-foreground sm:flex-1"
          placeholder="you@example.org"
        />
        <Button type="submit" variant="donate">
          Subscribe
        </Button>
      </div>
      <p id="newsletter-note" className="mt-2 text-sm text-sand">
        News from Enkaji Enkitati CBO. You confirm on the next page.
      </p>
    </form>
  )
}
