import type { Metadata, Viewport } from 'next'
import { Inter, Libre_Baskerville } from 'next/font/google'
import type { ReactNode } from 'react'

import { Analytics } from '@/components/layout/Analytics'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { buildNav } from '@/components/layout/nav'
import { getNavPrograms } from '@/lib/cms'
import { getPublicSiteSettings } from '@/lib/site-settings'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})
const libre = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
  variable: '--font-libre',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const description = 'Empowering Women, Sustaining Futures'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Enkaji Enkitati CBO', template: '%s | Enkaji Enkitati CBO' },
  description,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/brand/favicon.ico', sizes: '32x32' },
      { url: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: { url: '/brand/apple-touch-icon.png', sizes: '180x180' },
  },
  openGraph: {
    type: 'website',
    siteName: 'Enkaji Enkitati CBO',
    title: 'Enkaji Enkitati CBO',
    description,
    images: [
      { url: '/brand/og-default.png', width: 1200, height: 630, alt: 'Enkaji Enkitati CBO' },
    ],
  },
  twitter: { card: 'summary_large_image', images: ['/brand/og-default.png'] },
}

export const viewport: Viewport = {
  themeColor: '#1C380E',
  colorScheme: 'light',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [programs, settings] = await Promise.all([getNavPrograms(), getPublicSiteSettings()])

  return (
    <html lang="en" className={`${inter.variable} ${libre.variable}`}>
      <body>
        {/* Without JavaScript the entrance animations never run, so keep content visible. */}
        <noscript>
          <style>{'.motion-reveal{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        <a
          href="#main"
          className="fixed top-3 left-3 z-[60] -translate-y-20 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground focus:translate-y-0"
        >
          Skip to main content
        </a>
        <SiteHeader items={buildNav(programs)} />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter settings={settings} />
        <Analytics />
      </body>
    </html>
  )
}
