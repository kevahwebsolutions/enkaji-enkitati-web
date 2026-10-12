'use server'

import { headers } from 'next/headers'

import type { FormType } from '@/lib/forms/schemas'
import { processSubmission, type SubmitResult } from '@/lib/forms/submit'

/**
 * Server action behind every public form. The values come from the browser, so everything is
 * checked again on the server: the schema, the human check, the rate limit.
 */
export async function submitForm(formType: FormType, values: unknown): Promise<SubmitResult> {
  return processSubmission(formType, values, await headers())
}
