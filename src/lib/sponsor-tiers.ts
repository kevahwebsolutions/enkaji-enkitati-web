/**
 * Default event sponsorship tiers (FR-EVT-04). These match the table in
 * enkaji-content/content/partner.md; tests/unit/sponsor-tiers.spec.ts fails if the two drift apart.
 * They pre-fill new events in the admin and seed the upcoming events.
 */
export type SponsorTier = { name: string; minimumKes: number; benefits: string }

export const DEFAULT_SPONSOR_TIERS: SponsorTier[] = [
  {
    name: 'Platinum',
    minimumKes: 200000,
    benefits: 'Main branding partner, speaking slot, logo on all materials, media recognition',
  },
  {
    name: 'Gold',
    minimumKes: 100000,
    benefits: 'Branding on banners, recognition at the event, social media publicity',
  },
  { name: 'Silver', minimumKes: 50000, benefits: 'Mention at the event, logo placement' },
  { name: 'Bronze', minimumKes: 20000, benefits: 'Appreciation certificate, social media mention' },
]
