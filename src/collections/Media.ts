import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  editorField,
  editorsAndAbove,
  hiddenUnless,
  publicReadConsented,
  staffOnly,
  superAdminOnly,
} from '@/access'
import { auditAfterChange, auditAfterDelete } from '@/hooks/audit'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const webp = (quality: number) => ({ format: 'webp' as const, options: { quality } })

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media item', plural: 'Media' },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'consentOnFile', 'createdAt'],
    group: 'Media',
    hidden: hiddenUnless('super-admin', 'editor', 'contributor'),
    description:
      'Photos of children need guardian consent. Never upload IDs, certificates or signatures.',
  },
  access: {
    read: publicReadConsented,
    create: staffOnly,
    update: editorsAndAbove,
    delete: superAdminOnly,
  },
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
    // SVG is not allowed (NFR-SEC-05).
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    focalPoint: true,
    // FR-CMS-07: originals are converted to WebP, capped in size, and four responsive sizes are made.
    formatOptions: webp(85),
    resizeOptions: { width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true },
    adminThumbnail: 'thumb',
    imageSizes: [
      { name: 'thumb', width: 400, formatOptions: webp(80) },
      { name: 'card', width: 800, formatOptions: webp(80) },
      { name: 'hero', width: 1600, formatOptions: webp(82) },
      { name: 'og', width: 1200, height: 630, position: 'centre', formatOptions: webp(82) },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the image for people who cannot see it.' },
    },
    { name: 'caption', type: 'text' },
    { name: 'credit', type: 'text', admin: { description: 'Photographer or illustrator.' } },
    {
      name: 'consentOnFile',
      label: 'Consent on file',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      access: { create: editorField, update: editorField },
      admin: {
        position: 'sidebar',
        description:
          'Tick only when permission is recorded (guardian consent for anyone under 18). Without it the image cannot be shown publicly or used in published content.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateAfterChange, auditAfterChange],
    afterDelete: [revalidateAfterDelete, auditAfterDelete],
  },
}
