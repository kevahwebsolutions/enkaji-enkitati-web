import { z } from 'zod'

import { normaliseKenyanPhone } from '@/lib/phone'

/**
 * The form system's schemas. The browser (React Hook Form) and the server actions validate with
 * these same objects, so a form can never accept in one place what the other rejects.
 */

export const FORM_TYPES = [
  'contact',
  'volunteer',
  'partnership',
  'school-visit',
  'join',
  'pledge',
  'newsletter',
] as const

export type FormType = (typeof FORM_TYPES)[number]

export const FORM_LABELS: Record<FormType, string> = {
  contact: 'Contact message',
  volunteer: 'Volunteer sign-up',
  partnership: 'Partnership enquiry',
  'school-visit': 'School visit request',
  join: 'Request to join the CBO',
  pledge: 'Donation pledge',
  newsletter: 'Newsletter signup',
}

const required = (what: string, max: number) =>
  z.string().trim().min(1, `Enter ${what}.`).max(max, `Keep this under ${max} characters.`)

const optional = (max: number) =>
  z.string().trim().max(max, `Keep this under ${max} characters.`).default('')

const email = z
  .string()
  .trim()
  .max(200, 'Keep this under 200 characters.')
  .email('Enter a valid email address.')
const optionalEmail = z.union([z.literal(''), email]).default('')

const phoneMessage = 'Enter a Kenyan mobile number such as 0712 345 678.'
const phone = z
  .string()
  .trim()
  .refine((value) => normaliseKenyanPhone(value) !== null, phoneMessage)
const optionalPhone = z.union([z.literal(''), phone]).default('')

const message = (min: number) =>
  z
    .string()
    .trim()
    .min(min, `Please write at least ${min} characters.`)
    .max(4000, 'Keep your message under 4000 characters.')

/** Fields every form carries: consent, the honeypot and the Turnstile token. */
const common = {
  consent: z.literal(true, { error: 'Please agree so we can use your details.' }),
  // Honeypot: hidden from people. Bots fill it in, and the server turns them away quietly.
  website: z.string().optional().default(''),
  turnstileToken: z.string().optional().default(''),
}

type WithContact = { email: string; phone: string }

/** At least one way to reach the person. The error shows on the email field. */
const needsContact = <T extends z.ZodType<WithContact>>(schema: T) =>
  schema.refine((value) => Boolean(value.email || value.phone), {
    error: 'Give an email address or a phone number.',
    path: ['email'],
    // Run alongside the field checks so every problem is reported at once.
    when: () => true,
  })

export const contactSchema = z.object({
  name: required('your name', 100),
  email,
  phone: optionalPhone,
  message: message(10),
  ...common,
})

export const VOLUNTEER_INTERESTS = [
  'School mentorship',
  'Menstrual health sessions',
  'Tree planting and clean-ups',
  'Event support',
  'Skills training (beadwork, business)',
  'Office and fundraising help',
  'Photography and media',
] as const

export const volunteerSchema = needsContact(
  z.object({
    name: required('your name', 100),
    email: optionalEmail,
    phone: optionalPhone,
    interests: z
      .array(z.enum(VOLUNTEER_INTERESTS))
      .min(1, 'Choose at least one way you would like to help.'),
    availability: optional(200),
    message: optional(2000),
    ...common,
  }),
)

export const PARTNERSHIP_INTERESTS = [
  'Grant or institutional funding',
  'Corporate sponsorship or CSR',
  'Event sponsorship',
  'Government or NGO partnership',
  'Other',
] as const

export const partnershipSchema = z.object({
  name: required('your name', 100),
  organization: required('your organization', 150),
  email,
  phone: optionalPhone,
  interest: z.enum(PARTNERSHIP_INTERESTS, { error: 'Choose how you would like to partner.' }),
  message: message(10),
  ...common,
})

export const SCHOOL_LEVELS = ['Primary school', 'Secondary school', 'Both'] as const

export const schoolVisitSchema = needsContact(
  z.object({
    schoolName: required('the school name', 150),
    contactPerson: required('a contact person', 100),
    role: optional(100),
    email: optionalEmail,
    phone: optionalPhone,
    level: z.enum(SCHOOL_LEVELS, { error: 'Choose the level of the school.' }),
    preferredDates: required('preferred dates', 200),
    message: optional(2000),
    ...common,
  }),
)

export const joinSchema = z.object({
  name: required('your name', 100),
  phone,
  email: optionalEmail,
  area: required('your village or ward', 120),
  message: optional(2000),
  ...common,
})

export const PLEDGE_CHANNELS = ['M-PESA Paybill or Till', 'Bank transfer'] as const

export const pledgeSchema = z.object({
  name: optional(100),
  phone,
  email: optionalEmail,
  amount: z.coerce
    .number({ error: 'Enter an amount in KES.' })
    .int('Enter a whole number of shillings.')
    .min(100, 'The smallest pledge is KES 100.')
    .max(10_000_000, 'For a pledge this large, please contact us.'),
  /** Program slug, or empty for "where it is needed most". */
  program: optional(100),
  channel: z.enum(PLEDGE_CHANNELS, { error: 'Choose how you plan to give.' }),
  message: optional(1000),
  ...common,
})

export const newsletterSchema = z.object({
  email,
  consent: common.consent,
  website: common.website,
  turnstileToken: common.turnstileToken,
})

export const formSchemas = {
  contact: contactSchema,
  volunteer: volunteerSchema,
  partnership: partnershipSchema,
  'school-visit': schoolVisitSchema,
  join: joinSchema,
  pledge: pledgeSchema,
  newsletter: newsletterSchema,
} as const

export type FormValues<T extends FormType> = z.output<(typeof formSchemas)[T]>
export type FormInput<T extends FormType> = z.input<(typeof formSchemas)[T]>

/** Maps zod issues to one message per field, keeping the first for each. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    result[key] ??= issue.message
  }
  return result
}
