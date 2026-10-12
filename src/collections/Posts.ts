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
import { createdByField, draftVersions, isPlaceholderField, seoField } from '@/fields/common'
import { previewUrl } from '@/lib/preview'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Post', plural: 'Posts' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status', 'isPlaceholder'],
    group: 'Content',
    hidden: hiddenUnless('super-admin', 'editor', 'contributor'),
    preview: ({ slug }) => previewUrl('posts', slug as string | undefined),
  },
  defaultSort: '-publishedAt',
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
    { name: 'excerpt', type: 'textarea', required: true, maxLength: 260 },
    { name: 'body', type: 'richText', required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'News',
      options: ['News', 'Stories', 'Press', 'Reports'],
      admin: { position: 'sidebar' },
    },
    {
      name: 'programs',
      type: 'relationship',
      relationTo: 'programs',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'team',
      admin: {
        position: 'sidebar',
        description:
          'Shown publicly, so the Team entry must have consent on file. Stories about FGM, GBV or early marriage must use pseudonyms.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Set automatically on first publish when left blank.',
      },
    },
    seoField,
    isPlaceholderField,
    createdByField,
  ],
  hooks: {
    beforeChange: [
      forceDraftUnlessPublisher,
      setCreatedBy,
      ({ data }) => {
        if (data._status === 'published' && !data.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
      clearPlaceholderOnReplace(['title', 'excerpt', 'body', 'cover']),
      requireConsentOnPublish(),
    ],
    afterChange: [revalidateAfterChange, auditAfterChange],
    afterDelete: [revalidateAfterDelete, auditAfterDelete],
  },
}
