'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useId, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'

import { submitForm } from '@/app/actions/forms'
import { Button } from '@/components/ui/button'
import { formSchemas, type FormType } from '@/lib/forms/schemas'
import { cn } from '@/lib/utils'

import { TurnstileWidget } from './TurnstileWidget'

export type Option = string | { value: string; label: string }

export type FieldConfig =
  | {
      kind: 'text' | 'email' | 'tel' | 'number' | 'textarea'
      name: string
      label: string
      required?: boolean
      hint?: string
      autoComplete?: string
      placeholder?: string
      rows?: number
      min?: number
    }
  | {
      kind: 'select'
      name: string
      label: string
      required?: boolean
      hint?: string
      options: Option[]
      placeholder: string
    }
  | {
      kind: 'checkboxes'
      name: string
      label: string
      required?: boolean
      hint?: string
      options: string[]
    }

type Values = Record<string, unknown>

const inputClass =
  'w-full rounded-lg border border-border bg-white px-3 text-base text-ink aria-[invalid=true]:border-destructive'

const optionValue = (option: Option) => (typeof option === 'string' ? option : option.value)
const optionLabel = (option: Option) => (typeof option === 'string' ? option : option.label)

/**
 * One form component for every public form. It validates in the browser with the same zod schema
 * the server action uses (through React Hook Form), shows inline errors under each field, includes
 * the honeypot, the required consent checkbox with a link to the privacy notice, and Turnstile, then
 * posts to the server action, which checks everything again.
 */
export function AppForm({
  formType,
  fields,
  submitLabel,
  siteKey,
  defaultValues,
  successTitle = 'Thank you',
  consentLabel = 'I agree that Enkaji Enkitati CBO may use these details to respond to me.',
}: {
  formType: FormType
  fields: FieldConfig[]
  submitLabel: string
  /** Turnstile site key. Without one (local development) no widget is shown. */
  siteKey?: string
  defaultValues?: Values
  successTitle?: string
  consentLabel?: string
}) {
  const formId = useId()
  const [done, setDone] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [resetKey, setResetKey] = useState(0)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(formSchemas[formType]) as unknown as Resolver<Values>,
    defaultValues: {
      ...Object.fromEntries(
        fields.map((field) => [field.name, field.kind === 'checkboxes' ? [] : '']),
      ),
      consent: false,
      website: '',
      turnstileToken: '',
      ...defaultValues,
    },
    mode: 'onTouched',
  })

  const fieldId = (name: string) => `${formId}-${name}`
  const errorOf = (name: string): string | undefined => {
    const error = errors[name]
    return typeof error?.message === 'string' ? error.message : undefined
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    if (siteKey && !token) {
      setFormError('Please wait for the human check to finish, then send again.')
      return
    }
    const result = await submitForm(formType, { ...values, turnstileToken: token })
    if (result.ok) {
      setDone(result.message)
      return
    }
    for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(name, { type: 'server', message })
    }
    setFormError(result.message)
    // A Turnstile token works once, so ask for a fresh one before the next try.
    setToken('')
    setResetKey((key) => key + 1)
  })

  if (done) {
    return (
      <div role="status" className="rounded-xl border border-primary-soft bg-white p-6">
        <p className="font-serif text-xl font-bold text-primary">{successTitle}</p>
        <p className="mt-2 text-ink">{done}</p>
      </div>
    )
  }

  const describedBy = (name: string, hint?: string) =>
    errorOf(name) ? `${fieldId(name)}-error` : hint ? `${fieldId(name)}-hint` : undefined

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && (
        <p
          role="alert"
          className="rounded-lg border border-destructive bg-white p-4 font-semibold text-destructive"
        >
          {formError}
        </p>
      )}

      {fields.map((field) => {
        const error = errorOf(field.name)
        const id = fieldId(field.name)
        const common = {
          id,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy(field.name, field.hint),
        } as const

        return (
          <div key={field.name}>
            {field.kind === 'checkboxes' ? (
              <fieldset>
                <legend className="mb-1 font-semibold text-primary">
                  {field.label}
                  {field.required && <span aria-hidden="true"> *</span>}
                </legend>
                {field.hint && !error && (
                  <p id={`${id}-hint`} className="mb-2 text-sm text-ink">
                    {field.hint}
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {field.options.map((option) => (
                    <label
                      key={option}
                      className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-white px-3"
                    >
                      <input
                        type="checkbox"
                        value={option}
                        className="size-5 accent-[#1c380e]"
                        {...register(field.name)}
                      />
                      <span className="text-ink">{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              <>
                <label htmlFor={id} className="mb-1 block font-semibold text-primary">
                  {field.label}
                  {field.required && <span aria-hidden="true"> *</span>}
                </label>
                {field.kind === 'textarea' ? (
                  <textarea
                    {...common}
                    rows={field.rows ?? 5}
                    placeholder={field.placeholder}
                    className={cn(inputClass, 'py-2')}
                    {...register(field.name)}
                  />
                ) : field.kind === 'select' ? (
                  <select {...common} className={cn(inputClass, 'h-11')} {...register(field.name)}>
                    <option value="">{field.placeholder}</option>
                    {field.options.map((option) => (
                      <option key={optionValue(option)} value={optionValue(option)}>
                        {optionLabel(option)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...common}
                    type={field.kind}
                    inputMode={field.kind === 'number' ? 'numeric' : undefined}
                    min={field.kind === 'number' ? field.min : undefined}
                    autoComplete={field.autoComplete}
                    placeholder={field.placeholder}
                    className={cn(inputClass, 'h-11')}
                    {...register(field.name)}
                  />
                )}
                {field.hint && !error && (
                  <p id={`${id}-hint`} className="mt-1 text-sm text-ink">
                    {field.hint}
                  </p>
                )}
              </>
            )}
            {error && (
              <p
                id={`${id}-error`}
                role="alert"
                className="mt-1 text-sm font-semibold text-destructive"
              >
                {error}
              </p>
            )}
          </div>
        )
      })}

      {/* Honeypot: hidden from people and from assistive technology; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={fieldId('website')}>Leave this field empty</label>
        <input id={fieldId('website')} tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            aria-invalid={errorOf('consent') ? true : undefined}
            aria-describedby={errorOf('consent') ? `${fieldId('consent')}-error` : undefined}
            className="mt-1 size-5 shrink-0 accent-[#1c380e]"
            {...register('consent')}
          />
          <span className="text-ink">
            {consentLabel} See the{' '}
            <Link
              href="/privacy"
              className="font-semibold text-primary-soft underline underline-offset-4"
            >
              privacy notice
            </Link>
            .
          </span>
        </label>
        {errorOf('consent') && (
          <p
            id={`${fieldId('consent')}-error`}
            role="alert"
            className="mt-1 text-sm font-semibold text-destructive"
          >
            {errorOf('consent')}
          </p>
        )}
      </div>

      {siteKey && (
        <TurnstileWidget
          siteKey={siteKey}
          resetKey={resetKey}
          onToken={(value) => {
            setToken(value)
            setValue('turnstileToken', value)
          }}
        />
      )}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : submitLabel}
      </Button>
    </form>
  )
}
