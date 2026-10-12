import { BrandIcon } from '@/components/layout/BrandIcon'
import { shareTargets } from '@/lib/share'

import { CopyLinkButton } from './CopyLinkButton'

const itemClass =
  'inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-white px-4 font-semibold text-primary hover:border-primary-soft'

/** Share links for WhatsApp, Facebook, X and LinkedIn, plus copy link. No third-party scripts. */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  return (
    <ul aria-label="Share this story" className="flex flex-wrap gap-2">
      {shareTargets(url, title).map((target) => (
        <li key={target.key}>
          <a href={target.href} target="_blank" rel="noopener noreferrer" className={itemClass}>
            <BrandIcon name={target.key} className="size-5" />
            {target.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
      <li>
        <CopyLinkButton url={url} className={itemClass} />
      </li>
    </ul>
  )
}
