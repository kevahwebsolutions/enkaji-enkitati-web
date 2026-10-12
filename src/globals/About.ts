import type { GlobalConfig } from 'payload'

import { hiddenUnless, publicReadPublished, staffOnly } from '@/access'
import { auditGlobalAfterChange } from '@/hooks/audit'
import { requireGlobalConsentOnPublish } from '@/hooks/consent'
import { forceGlobalDraftUnlessPublisher } from '@/hooks/drafts'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'
import { draftVersions, seoField } from '@/fields/common'

export const About: GlobalConfig = {
  slug: 'about',
  label: 'About page',
  admin: {
    group: 'Content',
    hidden: hiddenUnless('super-admin', 'editor', 'contributor'),
    description: 'Vision, mission and values are drafts until the committee confirms them.',
  },
  versions: draftVersions,
  access: {
    read: publicReadPublished,
    update: staffOnly,
    readVersions: staffOnly,
  },
  fields: [
    { name: 'story', type: 'richText' },
    { name: 'vision', type: 'textarea' },
    { name: 'mission', type: 'textarea' },
    {
      name: 'values',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
      ],
    },
    { name: 'areaOfOperation', type: 'textarea' },
    {
      name: 'objectives',
      label: 'Constitutional objectives',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    { name: 'approach', label: 'Community-led approach', type: 'richText' },
    seoField,
  ],
  hooks: {
    beforeChange: [forceGlobalDraftUnlessPublisher, requireGlobalConsentOnPublish],
    afterChange: [revalidateGlobalAfterChange, auditGlobalAfterChange],
  },
}
