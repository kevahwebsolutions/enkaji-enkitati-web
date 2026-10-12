import { postgresAdapter } from '@payloadcms/db-postgres'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { isSuperAdmin } from './access/roles'
import { YouTubeBlock } from './blocks/YouTube'
import { Albums } from './collections/Albums'
import { AuditLog } from './collections/AuditLog'
import { Documents } from './collections/Documents'
import { Donations } from './collections/Donations'
import { Events } from './collections/Events'
import { FormSubmissions } from './collections/FormSubmissions'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Partners } from './collections/Partners'
import { Posts } from './collections/Posts'
import { Programs } from './collections/Programs'
import { Subscribers } from './collections/Subscribers'
import { Team } from './collections/Team'
import { Users } from './collections/Users'
import { About } from './globals/About'
import { Home } from './globals/Home'
import { Impact } from './globals/Impact'
import { SiteSettings } from './globals/SiteSettings'
import { purgeExpired } from './lib/forms/retention'
import { previewUrl } from './lib/preview'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: { titleSuffix: ' | Enkaji Enkitati CMS' },
    components: {
      beforeDashboard: ['/components/admin/DashboardStats#DashboardStats'],
    },
    livePreview: {
      collections: ['pages', 'posts', 'events', 'programs'],
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 360, height: 740 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
      url: ({ data, collectionConfig }) =>
        previewUrl(collectionConfig?.slug ?? '', (data as { slug?: string }).slug),
    },
  },
  collections: [
    // Content
    Programs,
    Events,
    Posts,
    Pages,
    Team,
    Partners,
    // Media
    Media,
    Albums,
    Documents,
    // Engagement
    FormSubmissions,
    Donations,
    Subscribers,
    // Settings
    Users,
    AuditLog,
  ],
  globals: [Home, About, Impact, SiteSettings],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({ blocks: [YouTubeBlock] }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  cors: [siteUrl],
  csrf: [siteUrl],
  // PDFs and images are capped at 10 MB (FR-DOC-02).
  upload: { limits: { fileSize: 10 * 1024 * 1024 } },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // The schema is changed only through reviewed migrations (npm run migrate:create).
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  jobs: {
    // Runs scheduled publishing (FR-CMS-10) every minute inside the app process.
    autoRun: [{ cron: '* * * * *', limit: 10, queue: 'default' }],
    access: { run: ({ req }) => isSuperAdmin(req.user) },
    tasks: [
      {
        // NFR-PRV-05: delete form submissions older than 24 months. Runs every night at 03:00.
        slug: 'purgeOldSubmissions',
        schedule: [{ cron: '0 0 3 * * *', queue: 'default' }],
        outputSchema: [
          { name: 'submissions', type: 'number' },
          { name: 'unconfirmed', type: 'number' },
        ],
        handler: async ({ req }) => ({ output: await purgeExpired(req.payload) }),
      },
    ],
  },
  sharp,
  plugins: [],
})
