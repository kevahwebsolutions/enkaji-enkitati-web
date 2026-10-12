import type { CollectionConfig } from 'payload'

import { engagementReaders, hiddenUnless, isSuperAdmin, nobody, superAdminOnly } from '@/access'
import { auditAfterChange, auditAfterDelete } from '@/hooks/audit'

/** Pledges (Phase 1) and M-PESA STK Push records (Phase 2). Written by server code only. */
export const Donations: CollectionConfig = {
  slug: 'donations',
  labels: { singular: 'Donation', plural: 'Donations' },
  admin: {
    useAsTitle: 'phone',
    defaultColumns: ['phone', 'amount', 'channel', 'status', 'createdAt'],
    group: 'Engagement',
    hidden: hiddenUnless('super-admin', 'editor', 'viewer'),
  },
  defaultSort: '-createdAt',
  access: {
    read: engagementReaders,
    create: nobody,
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'phone',
      type: 'text',
      required: true,
      admin: { description: "The donor's phone, normalised to 2547XXXXXXXX." },
    },
    { name: 'amount', label: 'Amount (KES)', type: 'number', required: true, min: 1 },
    { name: 'program', type: 'relationship', relationTo: 'programs' },
    {
      name: 'channel',
      type: 'select',
      required: true,
      options: [
        { label: 'M-PESA STK Push', value: 'mpesa-stk' },
        { label: 'M-PESA Paybill or Till', value: 'mpesa-manual' },
        { label: 'Bank transfer', value: 'bank' },
        { label: 'Pledge', value: 'pledge' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pledged', value: 'pledged' },
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    { name: 'checkoutRequestId', label: 'Checkout request ID', type: 'text', index: true },
    { name: 'mpesaReceipt', label: 'M-PESA receipt', type: 'text' },
    {
      name: 'rawCallback',
      type: 'json',
      access: { read: ({ req: { user } }) => isSuperAdmin(user) },
    },
  ],
  hooks: { afterChange: [auditAfterChange], afterDelete: [auditAfterDelete] },
}
