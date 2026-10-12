import type { CollectionConfig } from 'payload'

import { editorsAndAbove, hiddenUnless, nobody, superAdminField, superAdminOnly } from '@/access'
import { auditAfterChange, auditAfterDelete } from '@/hooks/audit'

/** Newsletter signups with double opt-in. Created by server actions through the local API. */
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Subscriber', plural: 'Subscribers' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'status', 'createdAt'],
    group: 'Engagement',
    hidden: hiddenUnless('super-admin', 'editor'),
  },
  defaultSort: '-createdAt',
  access: {
    read: editorsAndAbove,
    create: nobody,
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending confirmation', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
    {
      name: 'token',
      type: 'text',
      index: true,
      access: { read: superAdminField, create: () => false, update: () => false },
      admin: { hidden: true },
    },
  ],
  hooks: { afterChange: [auditAfterChange], afterDelete: [auditAfterDelete] },
}
