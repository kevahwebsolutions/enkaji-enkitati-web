import type { CollectionConfig } from 'payload'

import { editorsAndAbove, hiddenUnless, publicRead, superAdminOnly } from '@/access'
import { auditAfterChange, auditAfterDelete } from '@/hooks/audit'
import { requireConsentOnPublish } from '@/hooks/consent'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Partner', plural: 'Partners' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'tier', 'order'],
    group: 'Content',
    hidden: hiddenUnless('super-admin', 'editor', 'contributor'),
    description: 'Add a partner only with their permission to display the logo.',
  },
  defaultSort: 'order',
  access: {
    read: publicRead,
    create: editorsAndAbove,
    update: editorsAndAbove,
    delete: superAdminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media', required: true },
    { name: 'url', label: 'Website', type: 'text' },
    {
      name: 'tier',
      type: 'select',
      defaultValue: 'partner',
      options: [
        { label: 'Platinum', value: 'platinum' },
        { label: 'Gold', value: 'gold' },
        { label: 'Silver', value: 'silver' },
        { label: 'Bronze', value: 'bronze' },
        { label: 'Partner', value: 'partner' },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
  hooks: {
    beforeChange: [requireConsentOnPublish()],
    afterChange: [revalidateAfterChange, auditAfterChange],
    afterDelete: [revalidateAfterDelete, auditAfterDelete],
  },
}
