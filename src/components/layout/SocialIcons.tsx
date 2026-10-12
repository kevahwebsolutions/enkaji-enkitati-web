import type { PublicSiteSettings } from '@/lib/site-settings'
import { cn } from '@/lib/utils'

import { BrandIcon, type BrandName } from './BrandIcon'

const platforms: Array<{
  key: keyof PublicSiteSettings['socials']
  name: BrandName
  label: string
}> = [
  { key: 'facebook', name: 'facebook', label: 'Facebook' },
  { key: 'instagram', name: 'instagram', label: 'Instagram' },
  { key: 'x', name: 'x', label: 'X' },
  { key: 'tiktok', name: 'tiktok', label: 'TikTok' },
  { key: 'youtube', name: 'youtube', label: 'YouTube' },
  { key: 'linkedin', name: 'linkedin', label: 'LinkedIn' },
]

/** One icon per social link that an admin has filled in (FR-SOC-01). Nothing renders if none are set. */
export function SocialIcons({
  socials,
  orgName,
  className,
  tone = 'inverse',
}: {
  socials: PublicSiteSettings['socials']
  orgName: string
  className?: string
  /** Use "light" on pale backgrounds; the footer uses the default. */
  tone?: 'inverse' | 'light'
}) {
  const active = platforms.filter((platform) => socials[platform.key])
  if (active.length === 0) return null

  return (
    <ul className={cn('flex flex-wrap gap-2', className)} aria-label="Social media">
      {active.map((platform) => (
        <li key={platform.key}>
          <a
            href={socials[platform.key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${orgName} on ${platform.label} (opens in a new tab)`}
            className={cn(
              'inline-flex size-11 items-center justify-center rounded-full border transition-colors hover:bg-accent hover:text-primary motion-reduce:transition-none',
              tone === 'inverse' ? 'border-sand/30 text-sand' : 'border-primary/40 text-primary',
            )}
          >
            <BrandIcon name={platform.name} className="size-5" />
          </a>
        </li>
      ))}
    </ul>
  )
}
