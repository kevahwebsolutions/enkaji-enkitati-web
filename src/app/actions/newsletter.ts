'use server'

import { redirect } from 'next/navigation'

import { unsubscribe } from '@/lib/forms/newsletter'

/** Unsubscribes from the page's confirm button. It needs a click, so mail scanners cannot trigger it. */
export async function unsubscribeAction(formData: FormData): Promise<void> {
  const token = formData.get('t')
  const result = typeof token === 'string' ? await unsubscribe(token) : 'invalid'
  redirect(`/newsletter/status?state=${result === 'invalid' ? 'invalid' : 'unsubscribed'}`)
}
