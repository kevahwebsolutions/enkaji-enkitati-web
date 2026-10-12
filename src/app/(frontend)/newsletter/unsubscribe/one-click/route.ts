import { NextResponse, type NextRequest } from 'next/server'

import { unsubscribe } from '@/lib/forms/newsletter'

/**
 * One-click unsubscribe for mail apps that read the List-Unsubscribe-Post header (RFC 8058). It
 * accepts POST only, so a link scanner that merely fetches the address cannot unsubscribe anyone.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const result = await unsubscribe(request.nextUrl.searchParams.get('t') ?? '')
  return new NextResponse(null, { status: result === 'invalid' ? 400 : 200 })
}
