'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { submitRsvp, type RsvpFields, type RsvpState } from '@/app/(frontend)/events/[slug]/actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const initial: RsvpState = { status: 'idle' }

const inputClass =
  'h-11 w-full rounded-lg border border-border bg-white px-3 text-base text-ink aria-[invalid=true]:border-destructive'

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-semibold text-primary">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * RSVP form (FR-EVT-05). It posts to a Server Action, so it also works without JavaScript. The
 * server enforces capacity, so the numbers shown here are only a guide.
 */
export function RsvpForm({ slug, remaining }: { slug: string; remaining: number | null }) {
  const [state, action, pending] = useActionState(submitRsvp.bind(null, slug), initial)
  const errors: Partial<Record<RsvpFields, string>> = state.errors ?? {}
  const values = state.values
  const max = Math.min(10, remaining ?? 10)

  if (state.status === 'ok') {
    return (
      <div role="status" className="rounded-xl border border-primary-soft bg-white p-6">
        <p className="font-serif text-xl font-bold text-primary">You are registered</p>
        <p className="mt-2 text-ink">{state.message}</p>
        <p className="mt-2 text-sm text-ink">
          Add the event to your calendar above so you do not miss it.
        </p>
      </div>
    )
  }

  if (remaining === 0) {
    return (
      <p
        role="status"
        className="rounded-xl border border-border bg-white p-6 text-lg font-semibold text-primary"
      >
        Registration is full. Thank you for your interest. Follow our news for the next event.
      </p>
    )
  }

  const describedBy = (id: string, error?: string, hint?: boolean) =>
    error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <form action={action} noValidate className="space-y-5">
      {state.message && state.status !== 'idle' && (
        <p
          role="alert"
          className={cn(
            'rounded-lg border p-4 font-semibold',
            state.status === 'error'
              ? 'border-destructive text-destructive'
              : 'border-accent text-primary',
          )}
        >
          {state.message}
        </p>
      )}

      <Field id="rsvp-name" label="Full name" error={errors.name}>
        <input
          id="rsvp-name"
          name="name"
          autoComplete="name"
          required
          defaultValue={values?.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy('rsvp-name', errors.name)}
          className={inputClass}
        />
      </Field>

      <fieldset className="space-y-5">
        <legend className="mb-1 font-semibold text-primary">How can we reach you?</legend>
        <p className="-mt-3 text-sm text-ink">Give an email address, a phone number, or both.</p>
        {errors.contact && (
          <p role="alert" className="text-sm font-semibold text-destructive">
            {errors.contact}
          </p>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="rsvp-email" label="Email address">
            <input
              id="rsvp-email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={values?.email}
              aria-invalid={errors.contact ? true : undefined}
              className={inputClass}
            />
          </Field>
          <Field id="rsvp-phone" label="Phone number" hint="For example 0712 345 678">
            <input
              id="rsvp-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={values?.phone}
              aria-invalid={errors.contact ? true : undefined}
              aria-describedby="rsvp-phone-hint"
              className={inputClass}
            />
          </Field>
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="rsvp-org" label="Organization (optional)" error={errors.organization}>
          <input
            id="rsvp-org"
            name="organization"
            autoComplete="organization"
            defaultValue={values?.organization}
            className={inputClass}
          />
        </Field>
        <Field
          id="rsvp-attendees"
          label="Number of people"
          error={errors.attendees}
          hint={
            remaining !== null
              ? `${remaining} ${remaining === 1 ? 'place' : 'places'} left`
              : undefined
          }
        >
          <input
            id="rsvp-attendees"
            name="attendees"
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            required
            defaultValue={values?.attendees ?? '1'}
            aria-invalid={errors.attendees ? true : undefined}
            aria-describedby={describedBy('rsvp-attendees', errors.attendees, remaining !== null)}
            className={inputClass}
          />
        </Field>
      </div>

      {/* Honeypot: hidden from people and from assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="rsvp-website">Leave this field empty</label>
        <input id="rsvp-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={describedBy('rsvp-consent', errors.consent)}
            className="mt-1 size-5 shrink-0 accent-[#1c380e]"
          />
          <span className="text-ink">
            I agree that Enkaji Enkitati CBO may keep these details to organize this event. See the{' '}
            <Link
              href="/privacy"
              className="font-semibold text-primary-soft underline underline-offset-4"
            >
              privacy notice
            </Link>
            .
          </span>
        </label>
        {errors.consent && (
          <p
            id="rsvp-consent-error"
            role="alert"
            className="mt-1 text-sm font-semibold text-destructive"
          >
            {errors.consent}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Sending...' : 'Register'}
      </Button>
    </form>
  )
}
