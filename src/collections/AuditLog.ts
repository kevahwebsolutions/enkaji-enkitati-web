import type { CollectionConfig } from 'payload'

import { hiddenUnless, nobody, superAdminOnly } from '@/access'

/** FR-CMS-11: written by the audit hooks through the local API; nobody edits it by hand. */
export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: { singular: 'Audit entry', plural: 'Audit log' },
  admin: {
    useAsTitle: 'docLabel',
    defaultColumns: ['createdAt', 'action', 'collection', 'docLabel', 'userEmail'],
    group: 'Settings',
    hidden: hiddenUnless('super-admin'),
  },
  defaultSort: '-createdAt',
  access: {
    read: superAdminOnly,
    create: nobody,
    update: nobody,
    delete: nobody,
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      index: true,
      options: ['create', 'update', 'publish', 'delete', 'export'],
    },
    { name: 'collection', type: 'text', required: true, index: true },
    { name: 'docId', label: 'Document ID', type: 'text', required: true },
    { name: 'docLabel', label: 'Document', type: 'text' },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    {
      name: 'userEmail',
      type: 'text',
      admin: { description: 'Kept so the entry still names the person if the user is deleted.' },
    },
  ],
}
