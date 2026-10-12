import type { Block } from 'payload'

import { lucideIconValidator } from '@/fields/common'

const link = (name: string): Block['fields'] => [
  { name: `${name}Label`, type: 'text' },
  {
    name: `${name}Href`,
    type: 'text',
    admin: { description: 'A path such as /donate, or a full URL.' },
  },
]

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    ...link('cta'),
  ],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Rich text', plural: 'Rich text' },
  fields: [{ name: 'content', type: 'richText', required: true }],
}

export const CtaBlock: Block = {
  slug: 'cta',
  labels: { singular: 'Call to action', plural: 'Calls to action' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    ...link('button'),
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: 'Primary (green)', value: 'primary' },
        { label: 'Donate (gold)', value: 'donate' },
      ],
    },
  ],
}

export const CardsBlock: Block = {
  slug: 'cards',
  labels: { singular: 'Cards', plural: 'Cards' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'icon', type: 'text', validate: lucideIconValidator },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea' },
        { name: 'href', type: 'text' },
      ],
    },
  ],
}

export const FaqBlock: Block = {
  slug: 'faq',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
}

export const pageBlocks: Block[] = [HeroBlock, RichTextBlock, CtaBlock, CardsBlock, FaqBlock]
