'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

/**
 * Open/closed state that resets by itself when the route changes. The open flag is remembered with
 * the path it was opened on, so a different path reads as closed without an effect.
 */
export function useRouteScopedOpen(initial = false): [boolean, (open: boolean) => void] {
  const pathname = usePathname()
  const [state, setState] = useState({ open: initial, path: pathname })
  return [state.open && state.path === pathname, (open) => setState({ open, path: pathname })]
}
