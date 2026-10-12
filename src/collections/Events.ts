import { slugField, type CollectionConfig } from 'payload'

import {
  hiddenUnless,
  publicReadPublished,
  staffOnly,
  superAdminOnly,
  updateOwnDraftOrEditor,
} from '@/access'
import { auditAfterChange, auditAfterDelete } from '@/hooks/audit'
import { requireConsentOnPublish } from '@/hooks/consent'
import { forceDraftUnlessPublisher, setCreatedBy } from '@/hooks/drafts'
import { clearPlaceholderOnReplace } from '@/hooks/placeholder'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { createdByField, draftVersions, isPlaceholderField, seoField } from '@/fields/common'
import { previewUrl } from '@/lib/preview'
import { DEFAULT_SPONSOR_TIERS } from '@/lib/sponsor-tiers'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startsAt', 'status', '_status', 'isPlaceholder'],
    group: 'Content',
    hidden: hiddenUnless('super-admin', 'editor', 'contributor'),
    preview: ({ slug }) => previewUrl('events', slug as string | undefined),
  },
  defaultSort: '-startsAt',
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
      name: 'startsAt',
      label: 'Starts',
      type: 'date',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Times are Africa/Nairobi (EAT).',
      },
    },
    {
      name: 'endsAt',
      label: 'Ends',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
      validate: (value: Date | string | null | undefined, { siblingData }) => {
        const starts = (siblingData as { startsAt?: string | null }).startsAt
        if (value && starts && new Date(value) < new Date(starts)) {
          return 'The end must not be before the start.'
        }
        return true
      },
    },
    { name: 'venue', type: 'text', required: true },
    { name: 'theme', type: 'text' },
    {
      name: 'summary',
      type: 'textarea',
      maxLength: 400,
      admin: { description: 'Short description for cards and the event page.' },
    },
    {
      name: 'programs',
      type: 'relationship',
      relationTo: 'programs',
      hasMany: true,
      admin: { description: 'Used for the program filter and related events.' },
    },
    {
      name: 'agenda',
      type: 'array',
      fields: [
        { name: 'time', type: 'text', admin: { description: 'For example 09:00 or 9 am.' } },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
      ],
    },
    {
      name: 'sponsorTiers',
      label: 'Sponsorship tiers',
      type: 'array',
      defaultValue: DEFAULT_SPONSOR_TIERS,
      admin: {
        description:
          'Pre-filled with the default tiers (Platinum 200,000+, Gold 100,000+, Silver 50,000+, Bronze 20,000+). Remove rows for an event that takes no sponsors.',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'minimumKes', label: 'Minimum (KES)', type: 'number', required: true, min: 0 },
        { name: 'benefits', type: 'textarea' },
      ],
    },
    { name: 'rsvpEnabled', label: 'RSVP enabled', type: 'checkbox', defaultValue: false },
    {
      name: 'capacity',
      type: 'number',
      min: 1,
      admin: {
        condition: (data) => Boolean(data?.rsvpEnabled),
        description: 'RSVPs close when this many people have registered.',
      },
    },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'status',
      // The draft _status column already owns the enum name enum_events_status.
      enumName: 'events_lifecycle',
      label: 'Cancelled?',
      type: 'select',
      required: true,
      defaultValue: 'upcoming',
      options: [
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Past', value: 'past' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Only Cancelled does anything. Whether an event is upcoming or past is worked out from its end time (Nairobi time), so nothing needs updating when it finishes.',
      },
    },
    seoField,
    isPlaceholderField,
    createdByField,
  ],
  hooks: {
    beforeChange: [
      forceDraftUnlessPublisher,
      setCreatedBy,
      clearPlaceholderOnReplace(['title', 'summary', 'theme', 'agenda', 'cover']),
      requireConsentOnPublish(),
    ],
    afterChange: [revalidateAfterChange, auditAfterChange],
    afterDelete: [revalidateAfterDelete, auditAfterDelete],
  },
}
