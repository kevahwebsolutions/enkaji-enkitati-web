import type { CollectionConfig, Field, SelectField } from 'payload'

import { editorField, staffField } from '@/access'
import { SDG_NAMES } from '@/lib/sdg'

/** SEO fields per document (FR-CMS-09). Blank values fall back to site defaults on the frontend. */
export const seoField: Field = {
  name: 'meta',
  label: 'SEO',
  type: 'group',
  admin: { description: 'Leave blank to use sensible defaults from the page content.' },
  fields: [
    { name: 'title', label: 'Meta title', type: 'text', maxLength: 70 },
    { name: 'description', label: 'Meta description', type: 'textarea', maxLength: 180 },
    { name: 'image', label: 'Share image', type: 'upload', relationTo: 'media' },
  ],
}

/** Seed and sample records carry this flag until real content replaces them (FR-SEED-01). */
export const isPlaceholderField: Field = {
  name: 'isPlaceholder',
  label: 'Placeholder',
  type: 'checkbox',
  defaultValue: false,
  index: true,
  access: { create: editorField, update: editorField },
  admin: {
    position: 'sidebar',
    description:
      'Sample content that is not a real record. Clears itself when real content replaces it.',
    components: { Cell: '/components/admin/PlaceholderCell#PlaceholderCell' },
  },
}

/** Set on create so contributors can keep editing their own unpublished drafts. */
export const createdByField: Field = {
  name: 'createdBy',
  type: 'relationship',
  relationTo: 'users',
  access: { create: () => false, update: () => false, read: staffField },
  admin: { hidden: true },
}

/** Drafts, autosave, scheduled publishing and version history (FR-CMS-05, FR-CMS-10). */
export const draftVersions: NonNullable<CollectionConfig['versions']> = {
  maxPerDoc: 25,
  drafts: {
    autosave: { interval: 2000 },
    schedulePublish: true,
    validate: false,
  },
}

export const sdgOptions: NonNullable<SelectField['options']> = Object.entries(SDG_NAMES).map(
  ([number, name]) => ({ label: `SDG ${number}: ${name}`, value: number }),
)

/** Lucide icon name, for example "HandCoins". */
export const lucideIconValidator = (value: string | null | undefined): true | string =>
  !value || /^[A-Z][A-Za-z0-9]*$/.test(value) ? true : 'Use a Lucide icon name such as HandCoins.'
