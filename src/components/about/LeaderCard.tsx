import Image from 'next/image'

import { cn } from '@/lib/utils'
import type { Leader } from '@/lib/about-data'

/** Up to two initials, for the avatar shown when a person has no photo. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

/** Initials in a brand-coloured circle. Decorative: the name is always next to it. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-serif font-bold text-accent',
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  )
}

/** Official card: photo or initials avatar, name, role and a short bio. No contact details. */
export function LeaderCard({ leader }: { leader: Leader }) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-xl border border-border bg-white p-6">
      {leader.photo ? (
        <Image
          src={leader.photo.url}
          alt={`Portrait of ${leader.name}`}
          width={leader.photo.width}
          height={leader.photo.height}
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
          className="aspect-square w-32 rounded-full object-cover"
        />
      ) : (
        <Avatar name={leader.name} className="size-32 text-4xl" />
      )}
      <div>
        <h2 className="font-serif text-2xl leading-snug font-bold text-primary">{leader.name}</h2>
        <p className="mt-1 font-serif text-sm font-bold tracking-[0.2em] text-accent-ink uppercase">
          {leader.role}
        </p>
      </div>
      {leader.bio && <p className="text-ink">{leader.bio}</p>}
    </article>
  )
}
