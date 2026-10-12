import type { CollectionConfig } from 'payload'

import {
  editorField,
  editorsAndAbove,
  hiddenUnless,
  publicReadConsented,
  superAdminOnly,
} from '@/access'
import { auditAfterChange, auditAfterDelete } from '@/hooks/audit'
import { requireConsentOnPublish } from '@/hooks/consent'
import { clearPlaceholderOnReplace } from '@/hooks/placeholder'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { isPlaceholderField } from '@/fields/common'

export const Team: CollectionConfig = {
  slug: 'team',
  labels: { singular: 'Team member', plural: 'Team' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'order', 'consentOnFile', 'isPlaceholder'],
    group: 'Content',
    hidden: hiddenUnless('super-admin', 'editor', 'contributor'),
    description:
      'Name, role, photo and a short bio only. Never enter phone numbers, ID numbers or registration numbers.',
  },
  defaultSort: 'order',
  access: {
    read: publicReadConsented,
    create: editorsAndAbove,
    update: editorsAndAbove,
    delete: superAdminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'text',
      required: true,
      admin: { description: 'For example Chairperson.' },
    },
    { name: 'bio', type: 'textarea', maxLength: 500 },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    {
      name: 'consentOnFile',
      label: 'Consent on file',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      access: { create: editorField, update: editorField },
      admin: {
        position: 'sidebar',
        description: 'The person agreed to appear on the site. Without it this entry stays hidden.',
      },
    },
    isPlaceholderField,
  ],
  hooks: {
    beforeChange: [
      clearPlaceholderOnReplace(['name', 'role', 'bio', 'photo']),
      // A team entry without consent is not public, so its references are not checked yet.
      requireConsentOnPublish({ skip: (merged) => merged.consentOnFile !== true }),
    ],
    afterChange: [revalidateAfterChange, auditAfterChange],
    afterDelete: [revalidateAfterDelete, auditAfterDelete],
  },
}
