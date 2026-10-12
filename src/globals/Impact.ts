import type { GlobalConfig } from 'payload'

import { editorsAndAbove, hiddenUnless, publicRead } from '@/access'
import { auditGlobalAfterChange } from '@/hooks/audit'
import { requireGlobalConsentOnPublish } from '@/hooks/consent'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'
import { sdgOptions, seoField } from '@/fields/common'

export const Impact: GlobalConfig = {
  slug: 'impact',
  label: 'Impact and SDGs',
  admin: {
    group: 'Content',
    hidden: hiddenUnless('super-admin', 'editor'),
    description:
      'Targets are plans, not results. Add real results only when there is evidence for them.',
  },
  access: {
    read: publicRead,
    update: editorsAndAbove,
  },
  fields: [
    { name: 'intro', type: 'richText' },
    {
      name: 'sdgAlignment',
      label: 'SDG alignment',
      type: 'array',
      fields: [
        { name: 'sdg', label: 'SDG', type: 'select', required: true, options: sdgOptions },
        { name: 'activities', type: 'textarea', required: true },
      ],
    },
    {
      name: 'targetsLabel',
      type: 'text',
      defaultValue: '2026–2030 targets',
      admin: { description: 'Keep this label until real results exist.' },
    },
    {
      name: 'targets',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
      ],
    },
    {
      name: 'annualPlan',
      label: 'Annual plan by objective',
      type: 'array',
      admin: {
        description:
          'Planned budget for the year, in KES. These are plans, not spending. The page labels them that way.',
      },
      fields: [
        { name: 'objective', type: 'text', required: true },
        {
          name: 'amountKes',
          label: 'Planned budget (KES)',
          type: 'number',
          required: true,
          min: 0,
        },
      ],
    },
    {
      name: 'annualReports',
      type: 'relationship',
      relationTo: 'documents',
      hasMany: true,
    },
    seoField,
  ],
  hooks: {
    beforeChange: [requireGlobalConsentOnPublish],
    afterChange: [revalidateGlobalAfterChange, auditGlobalAfterChange],
  },
}
