'use client'

import { ChevronDown, Heart, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Stagger, StaggerItem } from '@/components/motion'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { isActive, type NavItem } from './nav'
import { useRouteScopedOpen } from './use-route-open'

const linkClass = 'flex min-h-11 items-center rounded-md px-3 text-base text-primary hover:bg-sand'

/** Slide-in menu for screens below the desktop breakpoint. Focus is trapped while it is open. */
export default function MobileNavSheet({
  items,
  defaultOpen = false,
}: {
  items: NavItem[]
  defaultOpen?: boolean
}) {
  const pathname = usePathname()
  const [open, setOpen] = useRouteScopedOpen(defaultOpen)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open menu">
          <Menu aria-hidden="true" className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88%] max-w-sm overflow-y-auto bg-sand p-0">
        <SheetHeader className="border-b border-border p-4 pr-14">
          <SheetTitle className="font-serif text-lg font-bold text-primary">Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="px-2 pb-6">
          <Stagger as="ul" className="space-y-1">
            {items.map((item) => (
              <StaggerItem as="li" key={item.label}>
                {item.type === 'link' ? (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.href ? 'page' : undefined}
                    className={cn(
                      linkClass,
                      isActive(pathname, item.href) && 'bg-bead/70 font-semibold',
                    )}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <details
                    className="group"
                    open={item.items.some((l) => isActive(pathname, l.href))}
                  >
                    <summary
                      className={cn(
                        linkClass,
                        'cursor-pointer list-none justify-between font-semibold [&::-webkit-details-marker]:hidden',
                      )}
                    >
                      {item.label}
                      <ChevronDown
                        aria-hidden="true"
                        className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                      />
                    </summary>
                    <ul className="ml-3 border-l-2 border-accent pl-2">
                      {item.items.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={() => setOpen(false)}
                            aria-current={pathname === link.href ? 'page' : undefined}
                            className={cn(
                              linkClass,
                              pathname === link.href && 'bg-bead/70 font-semibold',
                            )}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </StaggerItem>
            ))}
            <StaggerItem as="li" className="px-1 pt-3">
              <Button asChild variant="donate" size="lg" className="w-full">
                <Link href="/donate" onClick={() => setOpen(false)}>
                  <Heart aria-hidden="true" /> Donate
                </Link>
              </Button>
            </StaggerItem>
          </Stagger>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
