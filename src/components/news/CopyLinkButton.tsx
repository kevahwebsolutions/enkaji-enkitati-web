'use client'

import { Check, Link2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/** Copies the page address. The result is announced to screen readers through a live region. */
export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
    } catch {
      setState('failed')
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2500)
  }

  return (
    <>
      <button type="button" onClick={copy} className={className}>
        {state === 'copied' ? (
          <Check aria-hidden="true" className="size-5" />
        ) : (
          <Link2 aria-hidden="true" className="size-5" />
        )}
        Copy link
      </button>
      <span role="status" className="sr-only">
        {state === 'copied' ? 'Link copied' : state === 'failed' ? 'Could not copy the link' : ''}
      </span>
    </>
  )
}
