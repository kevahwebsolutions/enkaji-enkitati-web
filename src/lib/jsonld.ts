/** Serialises structured data for a script tag. "<" is escaped so content can never close the tag. */
export const jsonLd = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c')

type EventLdInput = {
  name: string
  url: string
  startsAt: string
  endsAt: string
  venue: string
  summary: string | null
  imageUrl: string | null
  cancelled: boolean
  orgName: string
  orgUrl: string
}

/** schema.org Event for an in-person event in Narok (NFR-SEO-03). Dates keep their +03:00 offset. */
export function eventJsonLd(input: EventLdInput): Record<string, unknown> {
  const nairobi = (iso: string): string => {
    const shifted = new Date(new Date(iso).getTime() + 3 * 60 * 60 * 1000)
    return `${shifted.toISOString().slice(0, 19)}+03:00`
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: input.name,
    url: input.url,
    startDate: nairobi(input.startsAt),
    endDate: nairobi(input.endsAt),
    eventStatus: input.cancelled
      ? 'https://schema.org/EventCancelled'
      : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: input.venue,
      address: { '@type': 'PostalAddress', addressLocality: 'Narok', addressCountry: 'KE' },
    },
    ...(input.summary ? { description: input.summary } : {}),
    ...(input.imageUrl ? { image: [input.imageUrl] } : {}),
    organizer: { '@type': 'Organization', name: input.orgName, url: input.orgUrl },
  }
}

type ArticleLdInput = {
  headline: string
  url: string
  description: string
  publishedAt: string | null
  modifiedAt: string
  imageUrl: string | null
  authorName: string | null
  orgName: string
  orgUrl: string
  logoUrl: string
}

/** schema.org Article for a news post (NFR-SEO-03). The author is the organization unless a person is shown. */
export function articleJsonLd(input: ArticleLdInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    dateModified: input.modifiedAt,
    ...(input.imageUrl ? { image: [input.imageUrl] } : {}),
    author: input.authorName
      ? { '@type': 'Person', name: input.authorName }
      : { '@type': 'Organization', name: input.orgName, url: input.orgUrl },
    publisher: {
      '@type': 'Organization',
      name: input.orgName,
      url: input.orgUrl,
      logo: { '@type': 'ImageObject', url: input.logoUrl },
    },
  }
}
