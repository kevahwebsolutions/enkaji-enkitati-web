'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useId, useRef } from 'react'

import { cn } from '@/lib/utils'

import { isActive, type NavLink } from './nav'
import { useRouteScopedOpen } from './use-route-open'

type NavDropdownProps = {
  label: string
  items: NavLink[]
}

/**
 * Disclosure menu: the button toggles a list of ordinary links, so Tab reaches every link once it
 * is open. Escape closes it and returns focus to the button; it also closes when focus leaves.
 */
export function NavDropdown({ label, items }: NavDropdownProps) {
  const pathname = usePathname()
  const [open, setOpen] = useRouteScopedOpen()
  const container = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const active = items.some((item) => isActive(pathname, item.href) && item.href !== '/programs')

  return (
    <div
      ref={container}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => {
        if (!container.current?.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          button.current?.focus()
        }
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-[0.95rem] font-semibold text-primary hover:bg-bead/60',
          active && 'underline decoration-accent decoration-2 underline-offset-8',
        )}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-4 transition-transform motion-reduce:transition-none',
            open && 'rotate-180',
          )}
        />
      </button>
      <ul
        id={panelId}
        hidden={!open}
        className="absolute top-full left-0 z-50 min-w-64 rounded-xl border border-border bg-white p-2 shadow-lg"
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center rounded-md px-3 text-[0.95rem] text-primary hover:bg-sand',
                pathname === item.href && 'bg-sand font-semibold',
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
