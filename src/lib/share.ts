export type ShareTarget = {
  key: 'whatsapp' | 'facebook' | 'x' | 'linkedin'
  label: string
  href: string
}

/**
 * Share links are plain addresses on each network. They load no script and set no cookie on this
 * site; the network is contacted only if the visitor chooses to follow the link.
 */
export function shareTargets(url: string, title: string): ShareTarget[] {
  const u = encodeURIComponent(url)
  const text = encodeURIComponent(title)
  return [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
    { key: 'x', label: 'X', href: `https://x.com/intent/post?text=${text}&url=${u}` },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    },
  ]
}
