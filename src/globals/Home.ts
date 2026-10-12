import type { GlobalConfig } from 'payload'

import { hiddenUnless, publicReadPublished, staffOnly } from '@/access'
import { auditGlobalAfterChange } from '@/hooks/audit'
import { requireGlobalConsentOnPublish } from '@/hooks/consent'
import { forceGlobalDraftUnlessPublisher } from '@/hooks/drafts'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'
import { draftVersions, sdgOptions, seoField } from '@/fields/common'

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Home page',
  admin: {
    group: 'Content',
    hidden: hiddenUnless('super-admin', 'editor', 'contributor'),
    description:
      'Program cards, upcoming events and latest news are pulled in automatically from their collections.',
  },
  versions: draftVersions,
  access: {
    read: publicReadPublished,
    update: staffOnly,
    readVersions: staffOnly,
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'headline', type: 'text', required: true },
        { name: 'subheadline', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'donateLabel', type: 'text', defaultValue: 'Donate' },
        { name: 'partnerLabel', type: 'text', defaultValue: 'Partner with us' },
      ],
    },
    {
      name: 'whereWeWork',
      label: 'Where we work',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'text', type: 'textarea' },
      ],
    },
    {
      name: 'sdgStrip',
      label: 'SDG strip',
      type: 'select',
      hasMany: true,
      options: sdgOptions,
      defaultValue: ['1', '3', '4', '5', '8', '13'],
    },
    {
      name: 'newsletter',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'text', type: 'textarea' },
      ],
    },
    seoField,
  ],
  hooks: {
    beforeChange: [forceGlobalDraftUnlessPublisher, requireGlobalConsentOnPublish],
    afterChange: [revalidateGlobalAfterChange, auditGlobalAfterChange],
  },
}
