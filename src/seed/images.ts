import sharp from 'sharp'

import { record, type SeedContext } from './upsert'

const C = {
  green: '#1C380E',
  soft: '#2E5A1C',
  gold: '#C4A050',
  deepGold: '#7A5C22',
  bead: '#EEE3C4',
  sand: '#F7F1E1',
} as const

const WIDTH = 1600
const HEIGHT = 1000

const defs = `
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.sand}"/>
    <stop offset="1" stop-color="${C.bead}"/>
  </linearGradient>
  <pattern id="bead" width="40" height="40" patternUnits="userSpaceOnUse">
    <rect width="40" height="40" fill="${C.sand}"/>
    <path d="M20 3 L37 20 L20 37 L3 20 Z" fill="${C.bead}" stroke="${C.gold}" stroke-width="2"/>
    <path d="M20 12 L28 20 L20 28 L12 20 Z" fill="${C.gold}"/>
  </pattern>
</defs>`

function frame(scene: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
${defs}
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>
${scene}
<rect y="912" width="${WIDTH}" height="8" fill="${C.green}"/>
<rect y="920" width="${WIDTH}" height="80" fill="url(#bead)"/>
</svg>`
}

function sun(cx: number, cy: number, radius: number, rays = 14): string {
  const lines: string[] = []
  for (let i = 0; i < rays; i++) {
    const angle = (Math.PI * 2 * i) / rays
    const x1 = cx + Math.cos(angle) * (radius + 26)
    const y1 = cy + Math.sin(angle) * (radius + 26)
    const x2 = cx + Math.cos(angle) * (radius + 26 + radius * 0.55)
    const y2 = cy + Math.sin(angle) * (radius + 26 + radius * 0.55)
    lines.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${C.gold}" stroke-width="${Math.max(8, radius / 9)}" stroke-linecap="round"/>`,
    )
  }
  return `<g>${lines.join('')}<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${C.gold}"/></g>`
}

function tree(x: number, base: number, scale: number): string {
  const trunkH = 150 * scale
  return `<g>
<rect x="${x - 14 * scale}" y="${base - trunkH}" width="${28 * scale}" height="${trunkH}" rx="8" fill="${C.deepGold}"/>
<circle cx="${x}" cy="${base - trunkH - 40 * scale}" r="${95 * scale}" fill="${C.soft}"/>
<circle cx="${x - 70 * scale}" cy="${base - trunkH - 5 * scale}" r="${65 * scale}" fill="${C.green}"/>
<circle cx="${x + 72 * scale}" cy="${base - trunkH - 8 * scale}" r="${62 * scale}" fill="${C.green}"/>
</g>`
}

function diamondField(): string {
  const cells: string[] = []
  const size = 130
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 14; col++) {
      const cx = col * size + (row % 2 === 0 ? 0 : size / 2)
      const cy = 60 + row * (size / 2)
      const fill = (row + col) % 3 === 0 ? C.green : (row + col) % 3 === 1 ? C.gold : C.bead
      const inner = (row + col) % 3 === 0 ? C.gold : (row + col) % 3 === 1 ? C.green : C.gold
      const half = size / 2 - 6
      cells.push(
        `<path d="M${cx} ${cy - half} L${cx + half} ${cy} L${cx} ${cy + half} L${cx - half} ${cy} Z" fill="${fill}" stroke="${C.sand}" stroke-width="4"/>`,
        `<path d="M${cx} ${cy - half / 2} L${cx + half / 2} ${cy} L${cx} ${cy + half / 2} L${cx - half / 2} ${cy} Z" fill="${inner}"/>`,
      )
    }
  }
  return cells.join('')
}

const hills = (fill: string, y: number) =>
  `<path d="M0 ${y} Q400 ${y - 140} 800 ${y - 20} T1600 ${y - 60} V912 H0 Z" fill="${fill}"/>`

const winding = (d: string, width: number) =>
  `<path d="${d}" fill="none" stroke="${C.gold}" stroke-width="${width}" stroke-linecap="round"/>
<path d="${d}" fill="none" stroke="${C.sand}" stroke-width="${Math.round(width / 9)}" stroke-linecap="round" stroke-dasharray="2 38" opacity="0.7"/>`

const book = (cx: number, y: number) => `<g>
<path d="M${cx} ${y + 40} Q${cx - 150} ${y} ${cx - 330} ${y + 30} V${y - 190} Q${cx - 150} ${y - 220} ${cx} ${y - 160} Z" fill="${C.sand}" stroke="${C.green}" stroke-width="10" stroke-linejoin="round"/>
<path d="M${cx} ${y + 40} Q${cx + 150} ${y} ${cx + 330} ${y + 30} V${y - 190} Q${cx + 150} ${y - 220} ${cx} ${y - 160} Z" fill="${C.sand}" stroke="${C.green}" stroke-width="10" stroke-linejoin="round"/>
<path d="M${cx - 270} ${y - 120} Q${cx - 150} ${y - 145} ${cx - 50} ${y - 108} M${cx - 270} ${y - 70} Q${cx - 150} ${y - 95} ${cx - 50} ${y - 58} M${cx + 270} ${y - 120} Q${cx + 150} ${y - 145} ${cx + 50} ${y - 108} M${cx + 270} ${y - 70} Q${cx + 150} ${y - 95} ${cx + 50} ${y - 58}" fill="none" stroke="${C.gold}" stroke-width="8" stroke-linecap="round"/>
</g>`

const dome = (cx: number, base: number, radius: number) => `<g>
<path d="M${cx - radius} ${base} A${radius} ${radius} 0 0 1 ${cx + radius} ${base} Z" fill="${C.green}"/>
<path d="M${cx - radius * 0.62} ${base} A${radius * 0.62} ${radius * 0.95} 0 0 1 ${cx} ${base - radius * 0.95}" fill="none" stroke="${C.sand}" stroke-width="10"/>
<path d="M${cx + radius * 0.62} ${base} A${radius * 0.62} ${radius * 0.95} 0 0 0 ${cx} ${base - radius * 0.95}" fill="none" stroke="${C.sand}" stroke-width="10"/>
<rect x="${cx - radius}" y="${base - 60}" width="${radius * 2}" height="60" fill="url(#bead)" stroke="${C.green}" stroke-width="8"/>
<rect x="${cx - radius - 30}" y="${base}" width="${radius * 2 + 60}" height="26" fill="${C.green}"/>
</g>`

export type SeedImage = {
  key:
    | 'women-economic-empowerment'
    | 'girls-dignity-health'
    | 'education-mentorship'
    | 'community-development'
    | 'vulnerable-households'
    | 'general'
  alt: string
  svg: string
}

export const seedImages: SeedImage[] = [
  {
    key: 'women-economic-empowerment',
    alt: 'Illustration of a beadwork pattern of green, gold and cream diamonds',
    svg: frame(diamondField()),
  },
  {
    key: 'girls-dignity-health',
    alt: 'Illustration of a sun rising over green hills with a gold path',
    svg: frame(
      `${sun(800, 560, 170, 18)}${hills(C.soft, 760)}${hills(C.green, 840)}${winding('M700 912 C780 830 930 800 860 720 C810 660 830 620 800 590', 56)}`,
    ),
  },
  {
    key: 'education-mentorship',
    alt: 'Illustration of an open book beneath a rising sun',
    svg: frame(
      `${sun(800, 330, 120, 16)}${hills(C.soft, 800)}${book(800, 760)}
<path d="M300 150 l14 14 -14 14 -14 -14z M1280 210 l14 14 -14 14 -14 -14z M380 350 l10 10 -10 10 -10 -10z" fill="${C.gold}"/>`,
    ),
  },
  {
    key: 'community-development',
    alt: 'Illustration of young trees growing on green hills under a small sun',
    svg: frame(
      `${sun(250, 200, 80, 12)}${hills(C.soft, 740)}${tree(450, 800, 1)}${tree(800, 820, 1.25)}${tree(1170, 800, 0.95)}${hills(C.green, 880)}
<path d="M600 130 q18 30 0 52 q-18 -22 0 -52z M1040 170 q18 30 0 52 q-18 -22 0 -52z M870 100 q14 24 0 42 q-14 -18 0 -42z" fill="${C.gold}"/>`,
    ),
  },
  {
    key: 'vulnerable-households',
    alt: 'Illustration of an enkaji dome house with a gold path leading to it',
    svg: frame(
      `${sun(1230, 300, 110, 16)}${hills(C.soft, 820)}${dome(720, 850, 330)}${winding('M720 912 C700 880 760 870 720 850', 70)}`,
    ),
  },
  {
    key: 'general',
    alt: 'Illustration of a dome house, a gold path and a rising sun',
    svg: frame(
      `${sun(1130, 360, 140, 16)}${dome(640, 830, 300)}${winding('M560 912 C640 860 880 860 900 760 C915 690 1040 650 1060 540', 60)}`,
    ),
  },
]

export type ImageKey = SeedImage['key']

/** Renders each SVG to WebP and uploads it as media with consent on file (no people are shown). */
export async function seedMedia(ctx: SeedContext): Promise<Map<ImageKey, number>> {
  const ids = new Map<ImageKey, number>()
  for (const image of seedImages) {
    const filename = `seed-cover-${image.key}.webp`
    const found = await ctx.payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const existing = found.docs[0]
    if (existing) {
      ids.set(image.key, existing.id)
      record(ctx, 'media', 'unchanged')
      continue
    }
    const data = await sharp(Buffer.from(image.svg)).webp({ quality: 85 }).toBuffer()
    const created = await ctx.payload.create({
      collection: 'media',
      data: {
        alt: image.alt,
        credit: 'Enkaji Enkitati CBO illustration',
        consentOnFile: true,
      },
      file: { data, name: filename, mimetype: 'image/webp', size: data.length },
      context: { disableRevalidate: true },
      overrideAccess: true,
    })
    ids.set(image.key, created.id)
    record(ctx, 'media', 'created')
  }
  return ids
}
