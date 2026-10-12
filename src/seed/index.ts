import 'dotenv/config'
import config from '@payload-config'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { getPayload, type CollectionSlug, type Payload } from 'payload'

import {
  bullets,
  numbered,
  parseFrontMatter,
  readContent,
  readJson,
  sectionBody,
  splitSections,
  tableRows,
  type Section,
} from './content'
import { HOME_DEFAULTS } from '../lib/home-defaults'
import { DEFAULT_SPONSOR_TIERS } from '../lib/sponsor-tiers'
import { seedMedia, type ImageKey } from './images'
import { privacyMarkdown, safeguardingMarkdown, termsMarkdown } from './legal'
import { upsertDoc, upsertGlobal, type Outcome, type SeedContext } from './upsert'

type Lexical = (markdown: string) => ReturnType<typeof convertMarkdownToLexical>

const PROGRAM_FILES = [
  'women-economic-empowerment',
  'girls-dignity-and-health',
  'education-and-mentorship',
  'community-development',
  'vulnerable-households',
] as const

const PROGRAM_IMAGE: Record<string, ImageKey> = {
  'women-economic-empowerment': 'women-economic-empowerment',
  'girls-dignity-and-health': 'girls-dignity-health',
  'education-and-mentorship': 'education-mentorship',
  'community-development': 'community-development',
  'vulnerable-households': 'vulnerable-households',
}

type SeedEvent = {
  slug: string
  title: string
  startsAt: string
  endsAt: string
  venue: string
  program: string
  status: 'upcoming' | 'past' | 'cancelled'
  theme: string
  summary: string
  isPlaceholder: boolean
}

type SeedPost = {
  slug: string
  title: string
  category: 'News' | 'Stories' | 'Press' | 'Reports'
  publishedAt: string
  program: string
  body: string[]
  isPlaceholder: boolean
}

const collectionsToCount: CollectionSlug[] = [
  'programs',
  'events',
  'posts',
  'pages',
  'team',
  'partners',
  'media',
  'albums',
  'documents',
  'users',
  'form-submissions',
  'donations',
  'subscribers',
]

const rows = (items: string[], key: string) => items.map((item) => ({ [key]: item }))

function excerptOf(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= 260) return clean
  return `${clean.slice(0, 257).replace(/\s+\S*$/, '')}...`
}

async function seedAdmin(ctx: SeedContext): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password) {
    ctx.payload.logger.warn(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are not both set; no admin user was created.',
    )
    return
  }
  const found = await ctx.payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (found.docs[0]) {
    ctx.tally.set('users', { created: 0, updated: 0, unchanged: 1, kept: 0 })
    return
  }
  await ctx.payload.create({
    collection: 'users',
    data: { name: 'Site administrator', email, password, role: 'super-admin' },
    overrideAccess: true,
  })
  ctx.tally.set('users', { created: 1, updated: 0, unchanged: 0, kept: 0 })
}

async function seedSiteSettings(ctx: SeedContext): Promise<void> {
  const { data } = parseFrontMatter(await readContent('organization.md'))
  await upsertGlobal(ctx, 'site-settings', {
    orgName: data.name,
    tagline: data.tagline,
    location: data.location,
    email: data.email,
    phone: data.phone,
    whatsapp: String(data.whatsapp),
  })
}

async function seedHome(ctx: SeedContext): Promise<void> {
  await upsertGlobal(ctx, 'home', {
    hero: {
      eyebrow: HOME_DEFAULTS.eyebrow,
      headline: HOME_DEFAULTS.headline,
      subheadline: HOME_DEFAULTS.lead,
      donateLabel: HOME_DEFAULTS.donateLabel,
      partnerLabel: HOME_DEFAULTS.partnerLabel,
    },
    whereWeWork: { heading: HOME_DEFAULTS.whereHeading, text: HOME_DEFAULTS.whereText },
    sdgStrip: [...HOME_DEFAULTS.sdgStrip],
    _status: 'published',
  })
}

/**
 * "Community-led change: a, b, c, and partnerships with x, y." becomes an intro line and a numbered
 * list, so the About page can show the approach as steps. Unrecognised text is kept as written.
 */
function approachMarkdown(text: string): string {
  const [lead, rest] = text.split(/:\s+/, 2)
  const match = rest ? /^(.*), and (partnerships with .*?)\.?$/.exec(rest) : null
  if (!lead || !match) return text
  const items = [...match[1].split(', '), match[2]]
  const sentence = (item: string) => item.charAt(0).toUpperCase() + item.slice(1)
  const list = items.map((item, i) => `${i + 1}. ${sentence(item)}`).join('\n')
  return `${lead}. We work through:\n\n${list}`
}

async function seedAbout(ctx: SeedContext, lexical: Lexical): Promise<void> {
  const { data, body } = parseFrontMatter(await readContent('organization.md'))
  const sections = splitSections(body)
  await upsertGlobal(ctx, 'about', {
    story: lexical(sectionBody(sections, 'about')),
    vision: sectionBody(sections, 'vision'),
    mission: sectionBody(sections, 'mission'),
    values: rows(
      sectionBody(sections, 'core values')
        .split(',')
        .map((value) => value.trim().replace(/\.$/, ''))
        .filter(Boolean),
      'title',
    ),
    areaOfOperation: String(data.areaOfOperation),
    objectives: rows(numbered(sectionBody(sections, 'constitutional objectives')), 'text'),
    approach: lexical(approachMarkdown(sectionBody(sections, 'our approach'))),
    _status: 'published',
  })
}

async function seedPrograms(
  ctx: SeedContext,
  lexical: Lexical,
  media: Map<ImageKey, number>,
): Promise<Map<string, number>> {
  const ids = new Map<string, number>()
  for (const file of PROGRAM_FILES) {
    const { data, body } = parseFrontMatter(await readContent(`programs/${file}.md`))
    const sections = splitSections(body)
    const slug = String(data.slug)

    const whatWeDo = sectionBody(sections, 'what we do')
    const activities = bullets(whatWeDo)
    const hasProjects = sections.some((s) => s.heading.toLowerCase() === 'projects')
    const projects = hasProjects ? bullets(sectionBody(sections, 'projects')) : []

    const consumed = ['the challenge', 'projects']
    const extra: Section[] = sections.filter((s) => !consumed.includes(s.heading.toLowerCase()))
    const extraSections =
      activities.length > 0 ? extra.filter((s) => s.heading.toLowerCase() !== 'what we do') : extra
    const extraMarkdown = extraSections.map((s) => `## ${s.heading}\n\n${s.body}`).join('\n\n')

    const imageKey = PROGRAM_IMAGE[slug]
    const result = await upsertDoc(
      ctx,
      'programs',
      { slug: { equals: slug } },
      {
        title: data.title,
        slug,
        icon: data.icon,
        summary: data.summary,
        problem: sectionBody(sections, 'the challenge'),
        activities: rows(activities, 'item'),
        projects: rows(projects, 'item'),
        sdgs: (data.sdgs as number[]).map(String),
        order: data.order,
        cover: media.get(imageKey),
        ...(extraMarkdown ? { body: lexical(extraMarkdown) } : {}),
        isPlaceholder: false,
        _status: 'published',
      },
    )
    ids.set(slug, result.id)
  }
  return ids
}

async function seedTeam(ctx: SeedContext): Promise<void> {
  const { body } = parseFrontMatter(await readContent('organization.md'))
  const officials = tableRows(sectionBody(splitSections(body), 'executive committee'))
  const bio = parseFrontMatter(await readContent('founder-bio.md')).body

  let order = 1
  for (const [role, name] of officials) {
    await upsertDoc(
      ctx,
      'team',
      { name: { equals: name } },
      {
        name,
        role,
        order: order++,
        // The founder's short bio is approved; every entry still needs a photo and consent.
        ...(role === 'Chairperson' ? { bio } : {}),
        consentOnFile: false,
        isPlaceholder: true,
      },
    )
  }
}

function governanceMarkdown(orgBody: string): string {
  const items = bullets(sectionBody(splitSections(orgBody), 'governance and accountability'))
  const pick = (start: string): string => {
    const found = items.find((item) => item.startsWith(start))
    if (!found) throw new Error(`Governance item starting "${start}" not found in organization.md`)
    return `- ${found}`
  }
  return [
    '## Committee and meetings',
    [
      pick('Elected committee'),
      pick('Monthly general meetings'),
      pick('Every project'),
      pick('Constitution amendments'),
    ].join('\n'),
    '## Money and records',
    [pick('Funds come from'), pick('Bank withdrawals'), pick('Records kept')].join('\n'),
    '## Reporting',
    pick('Reporting'),
    '## Offices',
    'The five elected offices are Chairperson, Vice Chairperson, Secretary, Assistant Secretary and Treasurer. You can meet the committee on the [leadership page](/about/leadership).',
  ].join('\n\n')
}

async function seedPages(ctx: SeedContext, lexical: Lexical): Promise<void> {
  const story = parseFrontMatter(await readContent('founder-story.md'))
  const founder = parseFrontMatter(await readContent('founder-bio.md'))
  const org = parseFrontMatter(await readContent('organization.md'))

  const pages: Array<{
    slug: string
    title: string
    eyebrow: string
    heading: string
    subheading?: string
    markdown: string[]
  }> = [
    {
      slug: 'founder',
      title: "Founder's story",
      eyebrow: "Founder's story",
      heading: String(story.data.title),
      subheading: `By ${String(story.data.author)}`,
      markdown: [story.body, `## About the founder\n\n${founder.body}`],
    },
    {
      slug: 'governance',
      title: 'Governance and accountability',
      eyebrow: 'Accountability',
      heading: 'How we are governed and held to account',
      subheading: 'An elected committee, open meetings and two signatures on every withdrawal.',
      markdown: [governanceMarkdown(org.body)],
    },
    {
      slug: 'privacy',
      title: 'Privacy notice',
      eyebrow: 'Your information',
      heading: 'Privacy notice',
      subheading: "How we handle your information under Kenya's Data Protection Act, 2019.",
      markdown: [privacyMarkdown],
    },
    {
      slug: 'terms',
      title: 'Terms of use',
      eyebrow: 'Using this site',
      heading: 'Terms of use',
      markdown: [termsMarkdown],
    },
    {
      slug: 'safeguarding',
      title: 'Child safeguarding and image consent',
      eyebrow: 'Protecting children',
      heading: 'Child safeguarding and image consent',
      subheading: 'How we protect children, and how we handle photos and stories.',
      markdown: [safeguardingMarkdown],
    },
  ]

  for (const page of pages) {
    await upsertDoc(
      ctx,
      'pages',
      { slug: { equals: page.slug } },
      {
        title: page.title,
        slug: page.slug,
        blocks: [
          {
            blockType: 'hero',
            eyebrow: page.eyebrow,
            heading: page.heading,
            ...(page.subheading ? { subheading: page.subheading } : {}),
          },
          ...page.markdown.map((markdown) => ({
            blockType: 'richText',
            content: lexical(markdown),
          })),
        ],
        _status: 'published',
      },
    )
  }
}

async function seedEvents(
  ctx: SeedContext,
  programIds: Map<string, number>,
  media: Map<ImageKey, number>,
): Promise<Map<string, number>> {
  const eventIds = new Map<string, number>()
  const events = await readJson<SeedEvent[]>('seed-events.json')
  for (const event of events) {
    const programId = programIds.get(event.program)
    const imageKey = PROGRAM_IMAGE[event.program] ?? 'general'
    const saved = await upsertDoc(
      ctx,
      'events',
      { slug: { equals: event.slug } },
      {
        title: event.title,
        slug: event.slug,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        venue: event.venue,
        ...(event.theme ? { theme: event.theme } : {}),
        summary: event.summary,
        // Some seed events point at areas that are not programs (governance, get-involved).
        programs: programId ? [programId] : [],
        // Upcoming or past is worked out from the end time; this field only marks cancellations.
        status: 'upcoming',
        ...(SPONSORED_EVENTS.has(event.slug) ? { sponsorTiers: DEFAULT_SPONSOR_TIERS } : {}),
        cover: media.get(imageKey),
        isPlaceholder: event.isPlaceholder,
        _status: 'published',
      },
    )
    eventIds.set(event.slug, saved.id)
  }
  return eventIds
}

/**
 * Two placeholder albums built from the illustrated covers (no photographs of people), so the
 * gallery and its lightbox are not empty before real photos arrive. Replace them with real albums.
 */
async function seedAlbums(
  ctx: SeedContext,
  programIds: Map<string, number>,
  eventIds: Map<string, number>,
  media: Map<ImageKey, number>,
): Promise<void> {
  const image = (key: ImageKey, caption: string) => ({ image: media.get(key), caption })
  await upsertDoc(
    ctx,
    'albums',
    { slug: { equals: 'programs-in-pictures' } },
    {
      title: 'Our programs in pictures',
      slug: 'programs-in-pictures',
      images: [
        image('women-economic-empowerment', 'Beadwork and women’s enterprise'),
        image('girls-dignity-health', 'Girls’ dignity and health'),
        image('education-mentorship', 'Education and mentorship'),
        image('community-development', 'Community development'),
        image('vulnerable-households', 'Support for vulnerable households'),
        image('general', 'Enkaji Enkitati CBO'),
      ],
      isPlaceholder: true,
    },
  )
  await upsertDoc(
    ctx,
    'albums',
    { slug: { equals: 'menstrual-hygiene-day-2026' } },
    {
      title: 'Menstrual Hygiene Day 2026',
      slug: 'menstrual-hygiene-day-2026',
      event: eventIds.get('menstrual-hygiene-day-2026'),
      program: programIds.get('girls-dignity-and-health'),
      images: [
        image('girls-dignity-health', 'A period is natural, not shameful'),
        image('general', 'Dignity packs for girls'),
      ],
      isPlaceholder: true,
    },
  )
}

const SPONSORED_EVENTS = new Set(['rural-women-day-2026', 'sixteen-days-of-activism-2026'])

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * FR-EVT-06: the advocacy days of the year as drafts, so the committee can review each one, add the
 * details and publish it. Days that already have a seeded event are skipped.
 */
async function seedAdvocacyDrafts(
  ctx: SeedContext,
  programIds: Map<string, number>,
): Promise<void> {
  const calendar =
    await readJson<
      Array<{ date: string; name: string; program: string; suggestedActivity: string }>
    >('advocacy-calendar.json')
  const seeded = await readJson<SeedEvent[]>('seed-events.json')
  const takenDays = new Set(seeded.map((event) => event.startsAt.slice(5, 10)))
  const year = new Date().getFullYear()

  for (const entry of calendar) {
    if (takenDays.has(entry.date)) continue
    const name = entry.name.replace(/\s*\(to 10 Dec\)$/, '')
    const programId = programIds.get(entry.program)
    await upsertDoc(
      ctx,
      'events',
      { slug: { equals: `${slugify(name)}-${year}` } },
      {
        title: name,
        slug: `${slugify(name)}-${year}`,
        startsAt: `${year}-${entry.date}T09:00:00+03:00`,
        endsAt: `${year}-${entry.date}T15:00:00+03:00`,
        venue: 'Ewaso Ng’iro, Narok',
        summary: entry.suggestedActivity,
        programs: programId ? [programId] : [],
        status: 'upcoming',
        isPlaceholder: true,
        _status: 'draft',
      },
      { draft: true },
    )
  }
}

async function seedPosts(
  ctx: SeedContext,
  lexical: Lexical,
  programIds: Map<string, number>,
  media: Map<ImageKey, number>,
): Promise<void> {
  const posts = await readJson<SeedPost[]>('seed-posts.json')
  for (const post of posts) {
    const programId = programIds.get(post.program)
    const imageKey = PROGRAM_IMAGE[post.program] ?? 'general'
    await upsertDoc(
      ctx,
      'posts',
      { slug: { equals: post.slug } },
      {
        title: post.title,
        slug: post.slug,
        excerpt: excerptOf(post.body[0]),
        body: lexical(post.body.join('\n\n')),
        category: post.category,
        programs: programId ? [programId] : [],
        publishedAt: `${post.publishedAt}T09:00:00+03:00`,
        cover: media.get(imageKey),
        isPlaceholder: post.isPlaceholder,
        _status: 'published',
      },
    )
  }
}

async function seedImpact(ctx: SeedContext, lexical: Lexical): Promise<void> {
  const sdgSource = await readContent('sdg-alignment.md')
  const partnerSource = await readContent('partner.md')

  const focus = /^Strongest focus:\s*(.+)$/m.exec(sdgSource)?.[1] ?? ''
  const alignment = tableRows(sdgSource).map(([sdg, activities]) => {
    const number = /^(\d+)\s/.exec(sdg)?.[1]
    if (!number) throw new Error(`Could not read SDG number from "${sdg}"`)
    return { sdg: number, activities }
  })

  const plan = tableRows(sectionBody(splitSections(partnerSource), 'annual plan'))
  const objectives = plan.filter(([name]) => name !== 'Total')

  // 2026 to 2030 targets are the projects each program plans to build, taken from the program
  // files. They carry no numbers because the source documents give none we can verify.
  const targets: Array<{ title: string; description: string }> = []
  for (const file of PROGRAM_FILES) {
    const { data, body } = parseFrontMatter(await readContent(`programs/${file}.md`))
    const sections = splitSections(body)
    const projects = sections.some((s) => s.heading.toLowerCase() === 'projects')
      ? bullets(sectionBody(sections, 'projects'))
      : []
    if (projects.length > 0) {
      targets.push({
        title: String(data.title),
        description: `We plan to build: ${projects.join('; ')}.`,
      })
    }
  }

  await upsertGlobal(ctx, 'impact', {
    intro: lexical(
      [
        `Our strongest focus is ${focus.replace(/\.$/, '')}. The table below shows how each Sustainable Development Goal connects to our activities.`,
        `We are a new organization, so this page shows our plans. Targets and budgets here describe what we aim to do, not what we have done. We will report results only when we can show evidence for them.`,
      ].join('\n\n'),
    ),
    sdgAlignment: alignment,
    targetsLabel: '2026–2030 targets',
    targets,
    annualPlan: objectives.map(([name, amount]) => ({
      objective: name,
      amountKes: Number(amount.replace(/[^\d]/g, '')),
    })),
  })
}

async function printCounts(payload: Payload, ctx: SeedContext): Promise<void> {
  const lines: string[] = []
  for (const collection of collectionsToCount) {
    const { totalDocs } = await payload.count({ collection, overrideAccess: true })
    const row = ctx.tally.get(collection)
    const change = row
      ? ` (created ${row.created}, updated ${row.updated}, unchanged ${row.unchanged}, kept ${row.kept})`
      : ''
    lines.push(`  ${collection.padEnd(18)} ${String(totalDocs).padStart(3)}${change}`)
  }
  const globals = ['site-settings', 'home', 'about', 'impact'] as const
  for (const slug of globals) {
    const row = ctx.tally.get(`global:${slug}`)
    const outcome = (Object.keys(row ?? {}) as Outcome[]).find((key) => row?.[key]) ?? 'unchanged'
    lines.push(`  global:${slug}`.padEnd(20) + `  ${outcome}`)
  }
  const placeholders: string[] = []
  for (const collection of ['events', 'posts', 'team'] as const) {
    const { totalDocs } = await payload.count({
      collection,
      where: { isPlaceholder: { equals: true } },
      overrideAccess: true,
    })
    placeholders.push(`${collection} ${totalDocs}`)
  }
  console.log(`\nSeed finished. Documents per collection:\n${lines.join('\n')}`)
  console.log(`\nPlaceholder records: ${placeholders.join(', ')}`)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const overwrite = args.includes('--overwrite')

  if (process.env.NODE_ENV === 'production' && !force) {
    console.error(
      'Refusing to seed with NODE_ENV=production. Pass --force if you really mean to (npm run seed -- --force).',
    )
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const ctx: SeedContext = { payload, overwrite, tally: new Map() }

  const editorConfig = await editorConfigFactory.default({ config: payload.config })
  const lexical: Lexical = (markdown) => convertMarkdownToLexical({ editorConfig, markdown })

  payload.logger.info(`Seeding${overwrite ? ' (overwriting edited records)' : ''}...`)
  await seedAdmin(ctx)
  const media = await seedMedia(ctx)
  await seedSiteSettings(ctx)
  await seedHome(ctx)
  await seedAbout(ctx, lexical)
  const programIds = await seedPrograms(ctx, lexical, media)
  await seedTeam(ctx)
  await seedPages(ctx, lexical)
  const eventIds = await seedEvents(ctx, programIds, media)
  await seedAlbums(ctx, programIds, eventIds, media)
  await seedAdvocacyDrafts(ctx, programIds)
  await seedPosts(ctx, lexical, programIds, media)
  await seedImpact(ctx, lexical)

  await printCounts(payload, ctx)
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
