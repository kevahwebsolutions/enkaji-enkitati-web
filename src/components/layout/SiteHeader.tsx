'use client'

import { Heart } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { Logo } from './Logo'
import { MobileNav } from './MobileNav'
import { NavDropdown } from './NavDropdown'
import { isActive, type NavItem } from './nav'

const SHRINK_AFTER = 24

function subscribe(onChange: () => void): () => void {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

const getScrolled = () => window.scrollY > SHRINK_AFTER
const getServerScrolled = () => false

/** Sticky, translucent header that shrinks once the page is scrolled (SRS 5.1). */
export function SiteHeader({ items }: { items: NavItem[] }) {
  const scrolled = useSyncExternalStore(subscribe, getScrolled, getServerScrolled)
  const pathname = usePathname()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/70 bg-sand/85 backdrop-blur-md transition-shadow motion-reduce:transition-none',
        scrolled && 'shadow-md',
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 transition-[height] duration-300 motion-reduce:transition-none sm:px-6 lg:px-8',
          scrolled ? 'h-14' : 'h-20',
        )}
      >
        <Link href="/" aria-label="Enkaji Enkitati CBO, home" className="rounded-md">
          <Logo
            markClassName={cn(
              'transition-[width,height] duration-300 motion-reduce:transition-none',
              scrolled ? 'size-9' : 'size-10 sm:size-12',
            )}
          />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 xl:flex">
          {items.map((item) =>
            item.type === 'menu' ? (
              <NavDropdown key={item.label} label={item.label} items={item.items} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-md px-3 text-[0.95rem] font-semibold text-primary hover:bg-bead/60',
                  isActive(pathname, item.href) &&
                    'underline decoration-accent decoration-2 underline-offset-8',
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button asChild variant="donate" className="px-3 sm:px-5">
            <Link href="/donate">
              <Heart aria-hidden="true" className="hidden sm:block" /> Donate
            </Link>
          </Button>
          <MobileNav items={items} />
        </div>
      </div>
    </header>
  )
}
