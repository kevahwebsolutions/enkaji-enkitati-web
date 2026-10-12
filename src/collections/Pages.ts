import { slugField, type CollectionConfig } from 'payload'

import {
  hiddenUnless,
  publicReadPublished,
  staffOnly,
  superAdminOnly,
  updateOwnDraftOrEditor,
} from '@/access'
import { pageBlocks } from '@/blocks/pageBlocks'
import { auditAfterChange, auditAfterDelete } from '@/hooks/audit'
import { requireConsentOnPublish } from '@/hooks/consent'
import { forceDraftUnlessPublisher, setCreatedBy } from '@/hooks/drafts'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { createdByField, draftVersions, seoField } from '@/fields/common'
import { previewUrl } from '@/lib/preview'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Content',
    hidden: hiddenUnless('super-admin', 'editor', 'contributor'),
    preview: ({ slug }) => previewUrl('pages', slug as string | undefined),
    description:
      'Founder story, governance, privacy, terms, safeguarding and other standalone pages.',
  },
  versions: draftVersions,
  access: {
    read: publicReadPublished,
    create: staffOnly,
    update: updateOwnDraftOrEditor,
    delete: superAdminOnly,
    readVersions: staffOnly,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ useAsSlug: 'title' }),
    {
      name: 'blocks',
      type: 'blocks',
      required: true,
      minRows: 1,
      blocks: pageBlocks,
    },
    seoField,
    createdByField,
  ],
  hooks: {
    beforeChange: [forceDraftUnlessPublisher, setCreatedBy, requireConsentOnPublish()],
    afterChange: [revalidateAfterChange, auditAfterChange],
    afterDelete: [revalidateAfterDelete, auditAfterDelete],
  },
}
