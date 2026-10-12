import {
  PARTNERSHIP_INTERESTS,
  PLEDGE_CHANNELS,
  SCHOOL_LEVELS,
  VOLUNTEER_INTERESTS,
} from '@/lib/forms/schemas'

import type { FieldConfig } from './AppForm'

/** Field lists for each public form. Labels and hints are the only copy the visitor sees. */

export const contactFields: FieldConfig[] = [
  { kind: 'text', name: 'name', label: 'Your name', required: true, autoComplete: 'name' },
  { kind: 'email', name: 'email', label: 'Email address', required: true, autoComplete: 'email' },
  {
    kind: 'tel',
    name: 'phone',
    label: 'Phone number (optional)',
    autoComplete: 'tel',
    hint: 'For example 0712 345 678',
  },
  { kind: 'textarea', name: 'message', label: 'Your message', required: true, rows: 6 },
]

export const volunteerFields: FieldConfig[] = [
  { kind: 'text', name: 'name', label: 'Your name', required: true, autoComplete: 'name' },
  {
    kind: 'email',
    name: 'email',
    label: 'Email address',
    autoComplete: 'email',
    hint: 'Give an email address, a phone number, or both.',
  },
  {
    kind: 'tel',
    name: 'phone',
    label: 'Phone number',
    autoComplete: 'tel',
    hint: 'For example 0712 345 678',
  },
  {
    kind: 'checkboxes',
    name: 'interests',
    label: 'How would you like to help?',
    required: true,
    options: [...VOLUNTEER_INTERESTS],
  },
  {
    kind: 'text',
    name: 'availability',
    label: 'When are you available? (optional)',
    hint: 'For example weekends, or school holidays.',
  },
  {
    kind: 'textarea',
    name: 'message',
    label: 'Anything else you would like us to know? (optional)',
    rows: 4,
  },
]

export const partnershipFields: FieldConfig[] = [
  { kind: 'text', name: 'name', label: 'Your name', required: true, autoComplete: 'name' },
  {
    kind: 'text',
    name: 'organization',
    label: 'Organization',
    required: true,
    autoComplete: 'organization',
  },
  { kind: 'email', name: 'email', label: 'Email address', required: true, autoComplete: 'email' },
  {
    kind: 'tel',
    name: 'phone',
    label: 'Phone number (optional)',
    autoComplete: 'tel',
    hint: 'For example 0712 345 678',
  },
  {
    kind: 'select',
    name: 'interest',
    label: 'How would you like to partner?',
    required: true,
    placeholder: 'Choose one',
    options: [...PARTNERSHIP_INTERESTS],
  },
  { kind: 'textarea', name: 'message', label: 'Tell us more', required: true, rows: 6 },
]

export const schoolVisitFields: FieldConfig[] = [
  {
    kind: 'text',
    name: 'schoolName',
    label: 'School name',
    required: true,
    autoComplete: 'organization',
  },
  {
    kind: 'text',
    name: 'contactPerson',
    label: 'Contact person',
    required: true,
    autoComplete: 'name',
  },
  {
    kind: 'text',
    name: 'role',
    label: 'Their role at the school (optional)',
    hint: 'For example head teacher.',
  },
  {
    kind: 'email',
    name: 'email',
    label: 'Email address',
    autoComplete: 'email',
    hint: 'Give an email address, a phone number, or both.',
  },
  {
    kind: 'tel',
    name: 'phone',
    label: 'Phone number',
    autoComplete: 'tel',
    hint: 'For example 0712 345 678',
  },
  {
    kind: 'select',
    name: 'level',
    label: 'School level',
    required: true,
    placeholder: 'Choose one',
    options: [...SCHOOL_LEVELS],
  },
  {
    kind: 'text',
    name: 'preferredDates',
    label: 'Preferred dates',
    required: true,
    hint: 'For example any Tuesday in March, or the first week of term.',
  },
  { kind: 'textarea', name: 'message', label: 'Anything else we should know? (optional)', rows: 4 },
]

export const joinFields: FieldConfig[] = [
  { kind: 'text', name: 'name', label: 'Your name', required: true, autoComplete: 'name' },
  {
    kind: 'tel',
    name: 'phone',
    label: 'Phone number',
    required: true,
    autoComplete: 'tel',
    hint: 'For example 0712 345 678',
  },
  { kind: 'email', name: 'email', label: 'Email address (optional)', autoComplete: 'email' },
  { kind: 'text', name: 'area', label: 'Village or ward', required: true },
  { kind: 'textarea', name: 'message', label: 'Why would you like to join? (optional)', rows: 4 },
]

/** Pledge fields. The program list comes from the CMS, so it is passed in. */
export function pledgeFields(programs: Array<{ slug: string; title: string }>): FieldConfig[] {
  return [
    { kind: 'text', name: 'name', label: 'Your name (optional)', autoComplete: 'name' },
    {
      kind: 'tel',
      name: 'phone',
      label: 'Phone number',
      required: true,
      autoComplete: 'tel',
      hint: 'For example 0712 345 678',
    },
    { kind: 'email', name: 'email', label: 'Email address (optional)', autoComplete: 'email' },
    {
      kind: 'number',
      name: 'amount',
      label: 'Pledge amount (KES)',
      required: true,
      min: 100,
      hint: 'The smallest pledge is KES 100.',
    },
    {
      kind: 'select',
      name: 'program',
      label: 'Which program?',
      placeholder: 'Where it is needed most',
      options: programs.map((program) => ({ value: program.slug, label: program.title })),
    },
    {
      kind: 'select',
      name: 'channel',
      label: 'How do you plan to give?',
      required: true,
      placeholder: 'Choose one',
      options: [...PLEDGE_CHANNELS],
    },
    { kind: 'textarea', name: 'message', label: 'A note for us (optional)', rows: 3 },
  ]
}

export const newsletterFields: FieldConfig[] = [
  { kind: 'email', name: 'email', label: 'Email address', required: true, autoComplete: 'email' },
]
