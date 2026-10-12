import { NextResponse, type NextRequest } from 'next/server'

import { confirmSubscription } from '@/lib/forms/newsletter'

/** Opened from the link in the confirmation email: confirms the subscription (double opt-in). */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('t') ?? ''
  const result = await confirmSubscription(token)
  const url = new URL('/newsletter/status', request.nextUrl.origin)
  url.searchParams.set('state', result)
  return NextResponse.redirect(url, 303)
}
