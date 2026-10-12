import { Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

import { BeadBand } from '@/components/sections/BeadBand'
import type { PublicSiteSettings } from '@/lib/site-settings'

import { BrandIcon } from './BrandIcon'
import { Logo } from './Logo'
import { NewsletterSignup } from './NewsletterSignup'
import { SocialIcons } from './SocialIcons'
import { footerActionLinks, footerExploreLinks, legalLinks, type NavLink } from './nav'

const linkClass =
  'inline-flex min-h-11 items-center text-sand underline-offset-4 hover:text-accent hover:underline'

function LinkColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="font-serif text-sm font-bold tracking-[0.2em] text-accent uppercase">
        {title}
      </h2>
      <ul className="mt-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Site footer (SRS 5.1). It never shows a registration or certificate number. */
export function SiteFooter({ settings }: { settings: PublicSiteSettings }) {
  const tel = settings.phone.replace(/[^\d+]/g, '')

  return (
    <footer>
      <BeadBand />
      <div className="bg-primary text-sand">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8 xl:grid-cols-[1.3fr_0.8fr_0.8fr_1.3fr]">
          <div>
            <Link
              href="/"
              aria-label={`${settings.orgName}, home`}
              className="inline-block rounded-md"
            >
              <Logo tone="cream" markClassName="size-14" wordmarkClassName="text-sm" />
            </Link>
            <p className="mt-4 max-w-xs font-serif text-lg font-bold text-sand">
              {settings.tagline}
            </p>
            <SocialIcons socials={settings.socials} orgName={settings.orgName} className="mt-5" />
          </div>

          <LinkColumn title="Explore" links={footerExploreLinks} />
          <LinkColumn title="Take part" links={footerActionLinks} />

          <div>
            <h2 className="font-serif text-sm font-bold tracking-[0.2em] text-accent uppercase">
              Contact
            </h2>
            <ul className="mt-3">
              <li>
                <a href={`mailto:${settings.email}`} className={linkClass}>
                  <Mail aria-hidden="true" className="mr-2 size-4 shrink-0" />
                  {settings.email}
                </a>
              </li>
              <li>
                <a href={`tel:${tel}`} className={linkClass}>
                  <Phone aria-hidden="true" className="mr-2 size-4 shrink-0" />
                  {settings.phone}
                </a>
              </li>
              {settings.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${settings.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    <BrandIcon name="whatsapp" className="mr-2 size-4 shrink-0" />
                    WhatsApp us<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              )}
              <li className="flex min-h-11 items-center">
                <MapPin aria-hidden="true" className="mr-2 size-4 shrink-0" />
                {settings.location}
              </li>
            </ul>
            <div className="mt-6">
              <NewsletterSignup />
            </div>
          </div>
        </div>

        <div className="border-t border-sand/20">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <p>
              &copy; {new Date().getFullYear()} {settings.orgName}. All rights reserved.
            </p>
            <nav aria-label="Legal">
              <ul className="flex flex-wrap gap-x-4">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
