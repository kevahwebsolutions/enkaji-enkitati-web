import Script from 'next/script'

/**
 * Cookieless analytics (NFR-PRV-06). Nothing loads unless NEXT_PUBLIC_ANALYTICS_SRC is set.
 * Plausible: also set NEXT_PUBLIC_ANALYTICS_DOMAIN. Umami: also set NEXT_PUBLIC_ANALYTICS_WEBSITE_ID.
 */
export function Analytics() {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC
  if (!src) return null

  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN
  const websiteId = process.env.NEXT_PUBLIC_ANALYTICS_WEBSITE_ID

  return (
    <Script
      src={src}
      strategy="afterInteractive"
      defer
      {...(domain ? { 'data-domain': domain } : {})}
      {...(websiteId ? { 'data-website-id': websiteId } : {})}
    />
  )
}
