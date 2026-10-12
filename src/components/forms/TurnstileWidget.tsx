'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

/**
 * Cloudflare Turnstile widget. It hands the token to the form; the server still verifies that token
 * with the secret key before anything is saved. Bump `resetKey` after a failed submit, because a
 * token can be used only once.
 */
export function TurnstileWidget({
  siteKey,
  onToken,
  resetKey,
}: {
  siteKey: string
  onToken: (token: string) => void
  resetKey: number
}) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>(undefined)
  const onTokenRef = useRef(onToken)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    let cancelled = false
    const mount = () => {
      if (cancelled || !container.current || !window.turnstile || widgetId.current) return
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        callback: (token) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(''),
        'error-callback': () => onTokenRef.current(''),
      })
    }
    mount()
    const timer = setInterval(() => {
      mount()
      if (widgetId.current) clearInterval(timer)
    }, 200)
    return () => {
      cancelled = true
      clearInterval(timer)
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
      widgetId.current = undefined
    }
  }, [siteKey])

  useEffect(() => {
    if (resetKey > 0 && widgetId.current) {
      onTokenRef.current('')
      window.turnstile?.reset(widgetId.current)
    }
  }, [resetKey])

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={container} data-testid="turnstile" className="min-h-[65px]" />
    </>
  )
}
