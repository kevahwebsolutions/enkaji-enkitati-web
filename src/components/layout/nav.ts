export type NavLink = { label: string; href: string }

export type NavItem =
  { type: 'link'; label: string; href: string } | { type: 'menu'; label: string; items: NavLink[] }

export const aboutLinks: NavLink[] = [
  { label: 'Who we are', href: '/about' },
  { label: 'Leadership', href: '/about/leadership' },
  { label: "Founder's story", href: '/about/founder' },
  { label: 'Governance', href: '/about/governance' },
  { label: 'Impact', href: '/impact' },
]

/** Primary navigation (SRS 5). Program links come from the CMS. */
export function buildNav(programs: { title: string; slug: string }[]): NavItem[] {
  return [
    { type: 'link', label: 'Home', href: '/' },
    { type: 'menu', label: 'About', items: aboutLinks },
    {
      type: 'menu',
      label: 'Programs',
      items: [
        { label: 'All programs', href: '/programs' },
        ...programs.map((program) => ({
          label: program.title,
          href: `/programs/${program.slug}`,
        })),
      ],
    },
    { type: 'link', label: 'Events', href: '/events' },
    { type: 'link', label: 'News', href: '/news' },
    { type: 'link', label: 'Get Involved', href: '/get-involved' },
    { type: 'link', label: 'Contact', href: '/contact' },
  ]
}

export const footerExploreLinks: NavLink[] = [
  { label: 'About us', href: '/about' },
  { label: 'Programs', href: '/programs' },
  { label: 'Impact', href: '/impact' },
  { label: 'Events', href: '/events' },
  { label: 'News', href: '/news' },
  { label: 'Gallery', href: '/gallery' },
]

export const footerActionLinks: NavLink[] = [
  { label: 'Get involved', href: '/get-involved' },
  { label: 'Partner with us', href: '/partner' },
  { label: 'Donate', href: '/donate' },
  { label: 'Contact', href: '/contact' },
]

export const legalLinks: NavLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Safeguarding', href: '/safeguarding' },
]

/** True when `href` is the current page or a parent section of it. */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
