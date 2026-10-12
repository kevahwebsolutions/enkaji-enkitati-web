'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

/** Copies a value to the clipboard and announces it with a short toast. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const show = (text: string, ok: boolean) => {
    setToast({ text, ok })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 3000)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      show(`${label} copied`, true)
    } catch {
      show(`Could not copy. Select the ${label.toLowerCase()} and copy it by hand.`, false)
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {toast?.ok ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
        Copy<span className="sr-only"> {label}</span>
      </Button>
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-6 z-50 flex justify-center"
      >
        {toast && (
          <p className="rounded-lg bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-lg">
            {toast.text}
          </p>
        )}
      </div>
    </>
  )
}
