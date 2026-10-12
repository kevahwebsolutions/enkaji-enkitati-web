import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

import { editorsAndAbove, hiddenUnless, publicRead, superAdminOnly } from '@/access'
import { auditAfterChange, auditAfterDelete } from '@/hooks/audit'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Document', plural: 'Documents' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'year'],
    group: 'Media',
    hidden: hiddenUnless('super-admin', 'editor', 'contributor'),
    description:
      'PDF only, up to 10 MB. Redact ID numbers, registration numbers, signatures and personal phone numbers before uploading.',
  },
  access: {
    read: publicRead,
    create: editorsAndAbove,
    update: editorsAndAbove,
    delete: superAdminOnly,
  },
  upload: {
    staticDir: path.resolve(dirname, '../../documents'),
    mimeTypes: ['application/pdf'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Organization profile', value: 'profile' },
        { label: 'Constitution (redacted)', value: 'constitution' },
        { label: 'Annual report', value: 'annual-report' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'year', type: 'number', min: 2020, max: 2100 },
  ],
  hooks: {
    afterChange: [revalidateAfterChange, auditAfterChange],
    afterDelete: [revalidateAfterDelete, auditAfterDelete],
  },
}
