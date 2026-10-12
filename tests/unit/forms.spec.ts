// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { csvCell, toCsv } from '@/lib/csv'
import {
  acknowledgementEmail,
  confirmationEmail,
  escapeHtml,
  notificationEmail,
} from '@/lib/forms/templates'
import { FORM_TYPES, fieldErrors, formSchemas, type FormType } from '@/lib/forms/schemas'

const consent = { consent: true as const }

const valid: Record<FormType, Record<string, unknown>> = {
  contact: {
    name: 'Amina',
    email: 'amina@example.org',
    message: 'Hello there, please call me.',
    ...consent,
  },
  volunteer: { name: 'Amina', phone: '0712 345 678', interests: ['Event support'], ...consent },
  partnership: {
    name: 'Amina',
    organization: 'Acme Foundation',
    email: 'amina@example.org',
    interest: 'Event sponsorship',
    message: 'We would like to sponsor an event.',
    ...consent,
  },
  'school-visit': {
    schoolName: 'Ewaso Primary',
    contactPerson: 'Mr Ole',
    email: 'school@example.org',
    level: 'Primary school',
    preferredDates: 'First week of term',
    ...consent,
  },
  join: { name: 'Amina', phone: '0712345678', area: 'Ewaso Ng’iro', ...consent },
  pledge: { phone: '+254712345678', amount: '2500', channel: 'Bank transfer', ...consent },
  newsletter: { email: 'amina@example.org', ...consent },
}

describe('form schemas', () => {
  it.each(FORM_TYPES)('%s accepts a complete valid submission', (type) => {
    expect(formSchemas[type].safeParse(valid[type]).success).toBe(true)
  })

  it.each(FORM_TYPES)('%s requires the consent checkbox', (type) => {
    const input = { ...valid[type], consent: false }
    const result = formSchemas[type].safeParse(input)
    expect(result.success).toBe(false)
    expect(fieldErrors(result.error!).consent).toBe('Please agree so we can use your details.')
  })

  it('reports every problem at once, including the contact rule', () => {
    const result = formSchemas.volunteer.safeParse({
      name: '',
      email: '',
      phone: '',
      interests: [],
      consent: false,
    })
    expect(result.success).toBe(false)
    const errors = fieldErrors(result.error!)
    expect(errors.name).toBe('Enter your name.')
    expect(errors.interests).toBe('Choose at least one way you would like to help.')
    expect(errors.email).toBe('Give an email address or a phone number.')
    expect(errors.consent).toBeTruthy()
  })

  it('checks email and phone formats', () => {
    const bad = formSchemas.contact.safeParse({
      ...valid.contact,
      email: 'not-an-email',
      phone: '12345',
    })
    const errors = fieldErrors(bad.error!)
    expect(errors.email).toBe('Enter a valid email address.')
    expect(errors.phone).toBe('Enter a Kenyan mobile number such as 0712 345 678.')
  })

  it('needs a Kenyan phone to join the CBO', () => {
    const result = formSchemas.join.safeParse({ ...valid.join, phone: '' })
    expect(fieldErrors(result.error!).phone).toBeTruthy()
  })

  it('validates the pledge amount', () => {
    expect(formSchemas.pledge.safeParse({ ...valid.pledge, amount: '50' }).success).toBe(false)
    expect(formSchemas.pledge.safeParse({ ...valid.pledge, amount: 'abc' }).success).toBe(false)
    expect(formSchemas.pledge.safeParse({ ...valid.pledge, amount: '2500.5' }).success).toBe(false)
    const ok = formSchemas.pledge.safeParse({ ...valid.pledge, amount: '2500' })
    expect(ok.success && ok.data.amount).toBe(2500)
  })

  it('rejects a school visit with no way to reach the school', () => {
    const result = formSchemas['school-visit'].safeParse({
      ...valid['school-visit'],
      email: '',
      phone: '',
    })
    expect(fieldErrors(result.error!).email).toBe('Give an email address or a phone number.')
  })

  it('trims text and fills optional fields with an empty string', () => {
    const result = formSchemas.contact.safeParse({ ...valid.contact, name: '  Amina  ' })
    expect(result.success && result.data.name).toBe('Amina')
    expect(result.success && result.data.phone).toBe('')
  })

  it('limits message length', () => {
    const result = formSchemas.contact.safeParse({ ...valid.contact, message: 'x'.repeat(4001) })
    expect(fieldErrors(result.error!).message).toBe('Keep your message under 4000 characters.')
  })
})

describe('CSV export', () => {
  it('quotes cells that contain commas, quotes or line breaks', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"')
  })

  it('neutralises spreadsheet formulas', () => {
    for (const dangerous of ['=SUM(A1:A9)', '+1+1', '-2+3', '@cmd', '\t=1']) {
      expect(csvCell(dangerous).startsWith("'") || csvCell(dangerous).startsWith('"\'')).toBe(true)
    }
  })

  it('writes lists, objects, booleans and empty values', () => {
    expect(csvCell(['a', 'b'])).toBe('a; b')
    expect(csvCell(true)).toBe('true')
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })

  it('builds a CRLF file with a byte order mark, in column order', () => {
    const csv = toCsv(['id', 'name'], [{ id: 1, name: 'A, B' }, { id: 2 }])
    expect(csv).toBe('﻿id,name\r\n1,"A, B"\r\n2,\r\n')
  })
})

describe('emails', () => {
  const values = {
    name: 'Amina <script>alert(1)</script>',
    email: 'amina@example.org',
    phone: '254712345678',
    message: 'Line one\nLine two & "quotes"',
  }

  it('escapes HTML so a visitor cannot inject markup', () => {
    expect(escapeHtml('<b onclick="x">&')).toBe('&lt;b onclick=&quot;x&quot;&gt;&amp;')
    const mail = notificationEmail('contact', values)
    expect(mail.html).not.toContain('<script>')
    expect(mail.html).toContain('&lt;script&gt;')
    expect(acknowledgementEmail('contact', String(values.name), values).html).not.toContain(
      '<script>',
    )
  })

  it('tells the inbox who wrote and what they said, in HTML and plain text', () => {
    const mail = notificationEmail('contact', values)
    expect(mail.subject).toBe('[Website] Contact message from Amina <script>alert(1)</script>')
    expect(mail.text).toContain('Email: amina@example.org')
    expect(mail.text).toContain('Message: Line one\nLine two & "quotes"')
    expect(mail.html).toContain('amina@example.org')
  })

  it('brands the acknowledgement in the logo colours and includes a text version', () => {
    const mail = acknowledgementEmail('volunteer', 'Amina', {
      name: 'Amina',
      interests: ['Event support'],
    })
    for (const hex of ['#1C380E', '#C4A050', '#F7F1E1', '#EEE3C4']) expect(mail.html).toContain(hex)
    expect(mail.html).toContain('cid:logo-mark')
    expect(mail.html).toContain('Enkaji Enkitati CBO')
    expect(mail.html).toContain('/privacy')
    expect(mail.text).toContain('Dear Amina,')
    expect(mail.text).toContain('Event support')
    expect(mail.text).not.toMatch(/<[a-z]/i)
  })

  it('does not echo phone or email back in the acknowledgement copy', () => {
    const mail = acknowledgementEmail('contact', 'Amina', {
      name: 'Amina',
      email: 'a@b.org',
      phone: '254712345678',
      message: 'Hi there friend',
    })
    expect(mail.text).not.toContain('254712345678')
    expect(mail.text).toContain('Hi there friend')
  })

  it('says a pledge takes no money', () => {
    expect(acknowledgementEmail('pledge', '', {}).text).toContain('takes no money from you')
  })

  it('confirmation email carries the confirm and unsubscribe links in both formats', () => {
    const mail = confirmationEmail(
      'https://x.test/newsletter/confirm?t=abc',
      'https://x.test/newsletter/unsubscribe?t=def',
    )
    for (const part of [mail.text, mail.html]) {
      expect(part).toContain('https://x.test/newsletter/confirm?t=abc')
      expect(part).toContain('https://x.test/newsletter/unsubscribe?t=def')
    }
    expect(mail.subject).toBe('Please confirm your newsletter subscription')
  })
})
