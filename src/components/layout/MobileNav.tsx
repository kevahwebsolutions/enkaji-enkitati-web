'use client'

import { Menu } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

import type { NavItem } from './nav'

// The dialog code (Radix, focus trap, stagger) is only fetched when someone reaches for the menu.
const loadSheet = () => import('./MobileNavSheet')
const MobileNavSheet = dynamic(loadSheet, { ssr: false })

/**
 * Menu button for screens below the desktop breakpoint. The first press loads the sheet and opens
 * it; hovering or focusing the button starts the download early.
 */
export function MobileNav({ items }: { items: NavItem[] }) {
  const [requested, setRequested] = useState(false)

  if (requested) return <MobileNavSheet items={items} defaultOpen />

  return (
    <Button
      variant="ghost"
      size="icon"
      className="xl:hidden"
      aria-label="Open menu"
      onPointerEnter={loadSheet}
      onFocus={loadSheet}
      onClick={() => setRequested(true)}
    >
      <Menu aria-hidden="true" className="size-6" />
    </Button>
  )
}
