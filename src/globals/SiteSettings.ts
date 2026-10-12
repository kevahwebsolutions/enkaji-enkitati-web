import type { Field, GlobalConfig } from 'payload'

import { editorsAndAbove, hiddenUnless, isSuperAdmin, publicRead, superAdminField } from '@/access'
import { auditGlobalAfterChange } from '@/hooks/audit'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'

const socialUrl = (value: string | null | undefined): true | string => {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? true : 'Use a link that starts with https://'
  } catch {
    return 'Enter a full link, for example https://facebook.com/yourpage'
  }
}

const social = (name: string, label: string): Field => ({
  name,
  label,
  type: 'text',
  validate: socialUrl,
  admin: { description: 'Leave blank to hide this icon.' },
})

/** Bank and M-PESA fields: only super-admins can read or change them, in the admin or the API. */
const payment = (field: Field): Field =>
  ({
    ...field,
    access: { read: superAdminField, create: superAdminField, update: superAdminField },
  }) as Field

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: {
    group: 'Settings',
    hidden: hiddenUnless('super-admin', 'editor'),
    description:
      'Public contact details. The only public phone number is the organization line. Never add personal numbers.',
  },
  access: {
    read: publicRead,
    update: editorsAndAbove,
  },
  fields: [
    {
      name: 'orgName',
      label: 'Organization name',
      type: 'text',
      required: true,
      defaultValue: 'Enkaji Enkitati CBO',
    },
    {
      name: 'tagline',
      type: 'text',
      required: true,
      defaultValue: 'Empowering Women, Sustaining Futures',
    },
    { name: 'location', type: 'text', required: true, defaultValue: 'Narok, Kenya' },
    {
      name: 'email',
      type: 'email',
      required: true,
      defaultValue: 'info@enkajienkitaticbo.org',
    },
    { name: 'phone', type: 'text', required: true, defaultValue: '+254 721 500197' },
    {
      name: 'whatsapp',
      label: 'WhatsApp number',
      type: 'text',
      defaultValue: '254721500197',
      admin: { description: 'Digits only, with country code and no plus sign.' },
    },
    {
      name: 'socials',
      label: 'Social links',
      type: 'group',
      fields: [
        social('facebook', 'Facebook'),
        social('instagram', 'Instagram'),
        social('x', 'X'),
        social('tiktok', 'TikTok'),
        social('youtube', 'YouTube'),
        social('linkedin', 'LinkedIn'),
      ],
    },
    {
      type: 'collapsible',
      label: 'Payment and bank details (super-admin only)',
      admin: {
        initCollapsed: true,
        condition: (_data, _sibling, { user }) => isSuperAdmin(user),
        description:
          'Never shown in the admin to other roles and never returned by the API. The Donate page reads them on the server.',
      },
      fields: [
        payment({ name: 'paybill', label: 'M-PESA Paybill', type: 'text' }),
        payment({ name: 'till', label: 'M-PESA Till', type: 'text' }),
        payment({ name: 'accountReference', label: 'Account reference', type: 'text' }),
        payment({ name: 'bankName', label: 'Bank name', type: 'text' }),
        payment({ name: 'bankBranch', label: 'Bank branch', type: 'text' }),
        payment({ name: 'accountName', label: 'Account name', type: 'text' }),
        payment({ name: 'accountNumber', label: 'Account number', type: 'text' }),
        payment({
          name: 'donateEnabled',
          label: 'Show payment details on the Donate page',
          type: 'checkbox',
          defaultValue: false,
        }),
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateGlobalAfterChange, auditGlobalAfterChange],
  },
}
