import { slugField, type CollectionConfig } from 'payload'

import { editorsAndAbove, hiddenUnless, publicRead, superAdminOnly } from '@/access'
import { auditAfterChange, auditAfterDelete } from '@/hooks/audit'
import { requireConsentOnPublish } from '@/hooks/consent'
import { clearPlaceholderOnReplace } from '@/hooks/placeholder'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { isPlaceholderField } from '@/fields/common'

export const Albums: CollectionConfig = {
  slug: 'albums',
  labels: { singular: 'Album', plural: 'Albums' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'event', 'program', 'isPlaceholder', 'updatedAt'],
    group: 'Media',
    hidden: hiddenUnless('super-admin', 'editor', 'contributor'),
    description:
      'Albums are public as soon as they are saved, so every image needs consent on file.',
  },
  access: {
    read: publicRead,
    create: editorsAndAbove,
    update: editorsAndAbove,
    delete: superAdminOnly,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ useAsSlug: 'title' }),
    { name: 'event', type: 'relationship', relationTo: 'events' },
    { name: 'program', type: 'relationship', relationTo: 'programs' },
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    isPlaceholderField,
  ],
  hooks: {
    beforeChange: [clearPlaceholderOnReplace(['title', 'images']), requireConsentOnPublish()],
    afterChange: [revalidateAfterChange, auditAfterChange],
    afterDelete: [revalidateAfterDelete, auditAfterDelete],
  },
}
