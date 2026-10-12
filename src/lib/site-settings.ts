import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { globalTag } from '@/lib/cache-tags'

export type PublicSiteSettings = {
  orgName: string
  tagline: string
  location: string
  email: string
  phone: string
  whatsapp: string | null
  socials: Partial<
    Record<'facebook' | 'instagram' | 'x' | 'tiktok' | 'youtube' | 'linkedin', string>
  >
}

export type PaymentDetails = {
  paybill: string | null
  till: string | null
  accountReference: string | null
  bankName: string | null
  bankBranch: string | null
  accountName: string | null
  accountNumber: string | null
}

/** Public organization details from SRS 2.1, used if the database cannot be reached. */
export const DEFAULT_SITE_SETTINGS: PublicSiteSettings = {
  orgName: 'Enkaji Enkitati CBO',
  tagline: 'Empowering Women, Sustaining Futures',
  location: 'Narok, Kenya',
  email: 'info@enkajienkitaticbo.org',
  phone: '+254 721 500197',
  whatsapp: '254721500197',
  socials: {},
}

async function loadSettings() {
  const payload = await getPayload({ config })
  // The local API bypasses access, so payment fields are present here and only here.
  return payload.findGlobal({ slug: 'site-settings', depth: 0 })
}

/** Contact details and social links. Safe for any page. */
export const getPublicSiteSettings = unstable_cache(
  async (): Promise<PublicSiteSettings> => {
    let s: Awaited<ReturnType<typeof loadSettings>>
    try {
      s = await loadSettings()
    } catch (error) {
      console.error('Could not load site settings', error)
      return DEFAULT_SITE_SETTINGS
    }
    const socials: PublicSiteSettings['socials'] = {}
    for (const [key, value] of Object.entries(s.socials ?? {})) {
      if (value && key in { facebook: 1, instagram: 1, x: 1, tiktok: 1, youtube: 1, linkedin: 1 }) {
        socials[key as keyof PublicSiteSettings['socials']] = value
      }
    }
    return {
      orgName: s.orgName,
      tagline: s.tagline,
      location: s.location,
      email: s.email,
      phone: s.phone,
      whatsapp: s.whatsapp ?? null,
      socials,
    }
  },
  ['site-settings:public'],
  { tags: [globalTag('site-settings')], revalidate: 3600 },
)

/**
 * Paybill, Till and bank details for the Donate page. Server-only: importing this file from a
 * client component fails the build. Returns null until an admin switches the details on.
 */
export const getPaymentDetails = unstable_cache(
  async (): Promise<PaymentDetails | null> => {
    const s = await loadSettings()
    if (!s.donateEnabled) return null
    const clean = (value: string | null | undefined) => value?.trim() || null
    const details: PaymentDetails = {
      paybill: clean(s.paybill),
      till: clean(s.till),
      accountReference: clean(s.accountReference),
      bankName: clean(s.bankName),
      bankBranch: clean(s.bankBranch),
      accountName: clean(s.accountName),
      accountNumber: clean(s.accountNumber),
    }
    // Switched on but with nothing usable filled in: behave as if giving is not open yet.
    return hasMpesa(details) || hasBank(details) ? details : null
  },
  ['site-settings:payment'],
  { tags: [globalTag('site-settings')] },
)

/** A Paybill or a Till is set. */
export const hasMpesa = (d: PaymentDetails): boolean => Boolean(d.paybill || d.till)

/** Enough to make a transfer: the account number plus the bank or the account name. */
export const hasBank = (d: PaymentDetails): boolean =>
  Boolean(d.accountNumber && (d.bankName || d.accountName))
