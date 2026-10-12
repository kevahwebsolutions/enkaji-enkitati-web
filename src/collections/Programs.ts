import { slugField, type CollectionConfig } from 'payload'

import {
  hiddenUnless,
  publicReadPublished,
  staffOnly,
  superAdminOnly,
  updateOwnDraftOrEditor,
} from '@/access'
import { auditAfterChange, auditAfterDelete } from '@/hooks/audit'
import { requireConsentOnPublish } from '@/hooks/consent'
import { forceDraftUnlessPublisher, setCreatedBy } from '@/hooks/drafts'
import { clearPlaceholderOnReplace } from '@/hooks/placeholder'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { previewUrl } from '@/lib/preview'
import {
  createdByField,
  draftVersions,
  isPlaceholderField,
  lucideIconValidator,
  sdgOptions,
  seoField,
} from '@/fields/common'

export const Programs: CollectionConfig = {
  slug: 'programs',
  labels: { singular: 'Program', plural: 'Programs' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', '_status', 'isPlaceholder', 'updatedAt'],
    group: 'Content',
    hidden: hiddenUnless('super-admin', 'editor', 'contributor'),
    preview: ({ slug }) => previewUrl('programs', slug as string | undefined),
  },
  defaultSort: 'order',
  versions: draftVersions,
  access: {
    read: publicReadPublished,
    create: staffOnly,
    update: updateOwnDraftOrEditor,
    delete: superAdminOnly,
    readVersions: staffOnly,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ useAsSlug: 'title' }),
    {
      name: 'icon',
      type: 'text',
      required: true,
      validate: lucideIconValidator,
      admin: { description: 'Lucide icon name, for example HandCoins or GraduationCap.' },
    },
    { name: 'summary', type: 'textarea', required: true, maxLength: 220 },
    {
      name: 'problem',
      type: 'textarea',
      admin: { description: 'The challenge this program responds to.' },
    },
    {
      name: 'activities',
      type: 'array',
      labels: { singular: 'Activity', plural: 'Activities' },
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    {
      name: 'projects',
      type: 'array',
      labels: { singular: 'Project', plural: 'Projects' },
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    { name: 'sdgs', label: 'SDGs', type: 'select', hasMany: true, options: sdgOptions },
    {
      name: 'body',
      label: 'More about this program',
      type: 'richText',
      admin: { description: 'Extra sections such as mentorship topic lists or key messages.' },
    },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
    seoField,
    isPlaceholderField,
    createdByField,
  ],
  hooks: {
    beforeChange: [
      forceDraftUnlessPublisher,
      setCreatedBy,
      clearPlaceholderOnReplace([
        'title',
        'summary',
        'problem',
        'activities',
        'projects',
        'body',
        'cover',
      ]),
      requireConsentOnPublish(),
    ],
    afterChange: [revalidateAfterChange, auditAfterChange],
    afterDelete: [revalidateAfterDelete, auditAfterDelete],
  },
}
