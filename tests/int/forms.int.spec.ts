// @vitest-environment node
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres/drizzle'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.setConfig({ testTimeout: 60_000 })
vi.mock('server-only', () => ({}))

const { processSubmission } = await import('@/lib/forms/submit')
const { hashIp } = await import('@/lib/forms/guard')
const { resetMailTransport } = await import('@/lib/forms/mail')
const { purgeExpired } = await import('@/lib/forms/retention')
const newsletter = await import('@/lib/forms/newsletter')

const MAILPIT = 'http://localhost:8025'
const run = Date.now()
const domain = `forms-test-${run}.example`
const mail = (name: string) => `${name}@${domain}`
let payload: Payload
let turnstile: Server
let ipCounter = 0
const ips: string[] = []

/** A unique connection per test, so the rate limit never leaks between them. */
const freshIp = (): string => {
  const ip = `10.${run % 250}.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`
  ips.push(ip)
  return ip
}
const headersFor = (ip: string) => new Headers({ 'x-forwarded-for': ip })

type MailpitMessage = {
  ID: string
  Subject: string
  To: Array<{ Address: string }>
}
type MailpitDetail = {
  Subject: string
  Text: string
  HTML: string
  To: Array<{ Address: string }>
  ReplyTo: Array<{ Address: string }>
  From: { Address: string }
  Inline: unknown[]
}

async function inbox(): Promise<MailpitMessage[]> {
  const response = await fetch(`${MAILPIT}/api/v1/messages?limit=200`)
  return ((await response.json()) as { messages: MailpitMessage[] }).messages
}

/** Waits for mail to arrive for an address; the SMTP hand-off is quick but not instant. */
async function messagesTo(address: string, expected: number): Promise<MailpitMessage[]> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const found = (await inbox()).filter((m) => m.To.some((t) => t.Address === address))
    if (found.length >= expected) return found
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return (await inbox()).filter((m) => m.To.some((t) => t.Address === address))
}

async function detail(id: string): Promise<MailpitDetail> {
  return (await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json()) as MailpitDetail
}

async function submissionsFor(ip: string) {
  const { docs } = await payload.find({
    collection: 'form-submissions',
    where: { ipHash: { equals: hashIp(ip) } },
    sort: 'createdAt',
    overrideAccess: true,
    pagination: false,
  })
  return docs
}

const validInputs = {
  contact: (n: string) => ({
    name: `Amina ${n}`,
    email: mail(`contact-${n}`),
    phone: '0712 345 678',
    message: 'Hello, I would like to know more about your programs.',
    consent: true,
    website: '',
    turnstileToken: 'good',
  }),
} as const

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  // A stand-in for Cloudflare: the token "good" passes, anything else fails.
  turnstile = createServer((request, response) => {
    let body = ''
    request.on('data', (chunk) => (body += chunk))
    request.on('end', () => {
      const token = new URLSearchParams(body).get('response')
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ success: token === 'good' }))
    })
  })
  await new Promise<void>((resolve) => turnstile.listen(0, '127.0.0.1', resolve))
  process.env.TURNSTILE_SECRET_KEY = 'test-secret'
  process.env.TURNSTILE_VERIFY_URL = `http://127.0.0.1:${(turnstile.address() as AddressInfo).port}/verify`
  process.env.SMTP_HOST = '127.0.0.1'
  process.env.SMTP_PORT = '1025'
  process.env.CONTACT_INBOX = mail('inbox')
  resetMailTransport()
}, 120_000)

beforeEach(() => {
  process.env.SMTP_PORT = '1025'
  process.env.TURNSTILE_VERIFY_URL = `http://127.0.0.1:${(turnstile.address() as AddressInfo).port}/verify`
  resetMailTransport()
})

afterAll(async () => {
  turnstile.close()
  const db = (payload.db as unknown as PostgresAdapter).drizzle
  for (const ip of ips) {
    await db.execute(sql`DELETE FROM form_submissions WHERE ip_hash = ${hashIp(ip)}`)
  }
  await payload.delete({
    collection: 'subscribers',
    where: { email: { contains: `@${domain}` } },
    overrideAccess: true,
    context: { skipAudit: true },
  })
  await payload.delete({
    collection: 'donations',
    where: { name: { contains: `forms-test-${run}` } },
    overrideAccess: true,
    context: { skipAudit: true },
  })
  await db.execute(
    sql`DELETE FROM form_submissions WHERE data->>'name' LIKE ${`purge-test-${run}%`}`,
  )
})

describe('every form, end to end against a real SMTP inbox', () => {
  it('contact: saves, mails the inbox with a reply-to, and sends a branded acknowledgement', async () => {
    const ip = freshIp()
    const input = validInputs.contact('a')
    const result = await processSubmission('contact', input, headersFor(ip))
    expect(result).toEqual({
      ok: true,
      message: 'Thank you. Your message has been sent. We will reply as soon as we can.',
    })

    const [saved] = await submissionsFor(ip)
    expect(saved.formType).toBe('contact')
    expect(saved.consent).toBe(true)
    expect(saved.emailStatus).toBe('sent')
    // The phone is saved in the 2547XXXXXXXX form; the honeypot and token are never stored.
    expect(saved.data).toEqual({
      name: 'Amina a',
      email: mail('contact-a'),
      phone: '254712345678',
      message: 'Hello, I would like to know more about your programs.',
    })
    expect(saved.ipHash).toBe(hashIp(ip))
    expect(JSON.stringify(saved)).not.toContain(ip)

    const [toInbox] = await messagesTo(mail('inbox'), 1)
    const notification = await detail(toInbox.ID)
    expect(notification.Subject).toBe('[Website] Contact message from Amina a')
    expect(notification.ReplyTo.map((r) => r.Address)).toEqual([mail('contact-a')])
    expect(notification.Text).toContain(
      'Message: Hello, I would like to know more about your programs.',
    )

    const [toSender] = await messagesTo(mail('contact-a'), 1)
    const ack = await detail(toSender.ID)
    expect(ack.Subject).toBe('We received your contact message')
    expect(ack.From.Address).toBe('info@enkajienkitaticbo.org')
    expect(ack.HTML).toContain('#1C380E')
    expect(ack.HTML).toContain('cid:logo-mark')
    expect(ack.Inline.length).toBeGreaterThan(0)
    expect(ack.Text).toContain('Dear Amina a,')
    expect(ack.Text.length).toBeGreaterThan(50)
  }, 60_000)

  const cases: Array<
    [Parameters<typeof processSubmission>[0], (n: string) => Record<string, unknown>, boolean]
  > = [
    [
      'volunteer',
      (n) => ({
        name: `Vol ${n}`,
        email: mail(`vol-${n}`),
        phone: '',
        interests: ['Event support', 'School mentorship'],
        availability: 'Weekends',
        message: '',
        consent: true,
        website: '',
        turnstileToken: 'good',
      }),
      true,
    ],
    [
      'partnership',
      (n) => ({
        name: `Par ${n}`,
        organization: 'Acme Foundation',
        email: mail(`par-${n}`),
        phone: '',
        interest: 'Event sponsorship',
        message: 'We would like to sponsor an event.',
        consent: true,
        website: '',
        turnstileToken: 'good',
      }),
      true,
    ],
    [
      'school-visit',
      (n) => ({
        schoolName: 'Ewaso Primary',
        contactPerson: `Sch ${n}`,
        role: 'Head teacher',
        email: mail(`sch-${n}`),
        phone: '',
        level: 'Primary school',
        preferredDates: 'First week of term',
        message: '',
        consent: true,
        website: '',
        turnstileToken: 'good',
      }),
      true,
    ],
    [
      'join',
      (n) => ({
        name: `Join ${n}`,
        phone: '+254 722 000 111',
        email: '',
        area: 'Narok Town',
        message: '',
        consent: true,
        website: '',
        turnstileToken: 'good',
      }),
      false,
    ],
  ]

  it.each(cases)(
    '%s: saves, notifies the inbox%s',
    async (type, build, hasEmail) => {
      const ip = freshIp()
      const n = `${type}-${ips.length}`
      const input = build(n)
      const before = (await inbox()).filter((m) =>
        m.To.some((t) => t.Address === mail('inbox')),
      ).length

      const result = await processSubmission(type, input, headersFor(ip))
      expect(result.ok).toBe(true)

      const [saved] = await submissionsFor(ip)
      expect(saved.formType).toBe(type)
      expect(saved.emailStatus).toBe('sent')
      expect(saved.data).not.toHaveProperty('website')
      expect(saved.data).not.toHaveProperty('turnstileToken')
      expect(saved.data).not.toHaveProperty('consent')

      for (let attempt = 0; attempt < 40; attempt++) {
        const now = (await inbox()).filter((m) =>
          m.To.some((t) => t.Address === mail('inbox')),
        ).length
        if (now > before) break
        await new Promise((resolve) => setTimeout(resolve, 150))
      }
      expect(
        (await inbox()).filter((m) => m.To.some((t) => t.Address === mail('inbox'))).length,
      ).toBe(before + 1)

      const senderMail = typeof input.email === 'string' && input.email ? input.email : null
      if (hasEmail && senderMail) {
        const [ackMessage] = await messagesTo(senderMail, 1)
        const ack = await detail(ackMessage.ID)
        expect(ack.HTML).toContain('#C4A050')
        expect(ack.Text).toContain('Enkaji Enkitati CBO')
      }
      // A phone-only sender has no address to acknowledge.
      if (!hasEmail) expect(saved.data).toHaveProperty('phone', '254722000111')
    },
    60_000,
  )

  it('pledge: saves a submission and a donation marked pledged, with the phone normalised', async () => {
    const ip = freshIp()
    const programs = await payload.find({ collection: 'programs', limit: 1, overrideAccess: true })
    const result = await processSubmission(
      'pledge',
      {
        name: `forms-test-${run} Donor`,
        phone: '0733 000 222',
        email: mail('donor'),
        amount: '2500',
        program: programs.docs[0].slug,
        channel: 'M-PESA Paybill or Till',
        message: '',
        consent: true,
        website: '',
        turnstileToken: 'good',
      },
      headersFor(ip),
    )
    expect(result.ok).toBe(true)

    const [saved] = await submissionsFor(ip)
    expect(saved.formType).toBe('pledge')
    expect(saved.data).toMatchObject({ amount: 2500, phone: '254733000222' })

    const donations = await payload.find({
      collection: 'donations',
      where: { name: { equals: `forms-test-${run} Donor` } },
      overrideAccess: true,
      depth: 0,
    })
    expect(donations.docs).toHaveLength(1)
    expect(donations.docs[0]).toMatchObject({
      phone: '254733000222',
      amount: 2500,
      status: 'pledged',
      channel: 'pledge',
    })
    expect(donations.docs[0].program).toBe(programs.docs[0].id)
    await messagesTo(mail('donor'), 1)
  }, 60_000)
})

describe('invalid input', () => {
  it('returns inline errors per field and saves and sends nothing', async () => {
    const ip = freshIp()
    const result = await processSubmission(
      'contact',
      {
        name: '',
        email: 'nope',
        phone: '123',
        message: 'short',
        consent: false,
        website: '',
        turnstileToken: 'good',
      },
      headersFor(ip),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.fieldErrors).toMatchObject({
      name: 'Enter your name.',
      email: 'Enter a valid email address.',
      phone: 'Enter a Kenyan mobile number such as 0712 345 678.',
      message: 'Please write at least 10 characters.',
      consent: 'Please agree so we can use your details.',
    })
    expect(await submissionsFor(ip)).toHaveLength(0)
  })

  it('rejects an unknown form type', async () => {
    expect(await processSubmission('nope' as never, {}, headersFor(freshIp()))).toEqual({
      ok: false,
      message: 'Unknown form.',
    })
  })
})

describe('Turnstile is verified on the server', () => {
  it.each([
    ['a token Cloudflare rejects', 'bad'],
    ['no token at all', ''],
  ])('rejects %s and saves nothing', async (_name, token) => {
    const ip = freshIp()
    const result = await processSubmission(
      'contact',
      { ...validInputs.contact('ts'), turnstileToken: token },
      headersFor(ip),
    )
    expect(result.ok).toBe(false)
    expect(await submissionsFor(ip)).toHaveLength(0)
    expect(await messagesTo(mail('contact-ts'), 1)).toHaveLength(0)
  })

  it('rejects when the check cannot be reached (fails closed)', async () => {
    process.env.TURNSTILE_VERIFY_URL = 'http://127.0.0.1:1/unreachable'
    const ip = freshIp()
    const result = await processSubmission('contact', validInputs.contact('down'), headersFor(ip))
    expect(result).toEqual({
      ok: false,
      message: 'The human check could not be completed. Please try again in a moment.',
    })
    expect(await submissionsFor(ip)).toHaveLength(0)
  })

  it('rejects with the real Cloudflare "always fails" test secret, and accepts the "always passes" one', async () => {
    delete process.env.TURNSTILE_VERIFY_URL
    try {
      process.env.TURNSTILE_SECRET_KEY = '2x0000000000000000000000000000000AA'
      const failIp = freshIp()
      const failed = await processSubmission(
        'contact',
        { ...validInputs.contact('cf-fail'), turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' },
        headersFor(failIp),
      )
      expect(failed.ok).toBe(false)
      expect(await submissionsFor(failIp)).toHaveLength(0)

      process.env.TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA'
      const okIp = freshIp()
      const passed = await processSubmission(
        'contact',
        { ...validInputs.contact('cf-pass'), turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' },
        headersFor(okIp),
      )
      expect(passed.ok).toBe(true)
    } finally {
      process.env.TURNSTILE_SECRET_KEY = 'test-secret'
    }
  }, 60_000)
})

describe('spam protection', () => {
  it('a filled honeypot looks like success but saves and sends nothing', async () => {
    const ip = freshIp()
    const result = await processSubmission(
      'contact',
      { ...validInputs.contact('bot'), website: 'http://spam.example' },
      headersFor(ip),
    )
    expect(result.ok).toBe(true)
    expect(await submissionsFor(ip)).toHaveLength(0)
    expect(await messagesTo(mail('contact-bot'), 1)).toHaveLength(0)
  })

  it('allows 5 submissions from one connection in 10 minutes and refuses the 6th', async () => {
    const ip = freshIp()
    for (let n = 0; n < 5; n++) {
      const result = await processSubmission(
        'contact',
        validInputs.contact(`rl${n}`),
        headersFor(ip),
      )
      expect(result.ok, `submission ${n + 1}`).toBe(true)
    }
    const sixth = await processSubmission('contact', validInputs.contact('rl5'), headersFor(ip))
    expect(sixth).toEqual({
      ok: false,
      message:
        'Too many submissions from your connection. Please wait a few minutes and try again.',
    })
    expect(await submissionsFor(ip)).toHaveLength(5)
    // Another connection is unaffected.
    expect(
      (await processSubmission('contact', validInputs.contact('rl-other'), headersFor(freshIp())))
        .ok,
    ).toBe(true)
  }, 90_000)

  it('stores only a salted hash of the address', () => {
    const hash = hashIp('203.0.113.9')
    expect(hash).toMatch(/^[0-9a-f]{32}$/)
    expect(hash).not.toContain('203')
    expect(hashIp('203.0.113.9')).toBe(hash)
    expect(hashIp('203.0.113.10')).not.toBe(hash)
  })
})

describe('mail trouble never loses a submission', () => {
  it('saves it and marks the email as failed when the mail server is down', async () => {
    process.env.SMTP_PORT = '1'
    resetMailTransport()
    const ip = freshIp()
    const result = await processSubmission(
      'contact',
      validInputs.contact('smtp-down'),
      headersFor(ip),
    )
    expect(result.ok).toBe(true)
    const [saved] = await submissionsFor(ip)
    expect(saved.emailStatus).toBe('failed')
  }, 60_000)

  it('saves it and marks the email as skipped when no mail server is configured', async () => {
    const host = process.env.SMTP_HOST
    delete process.env.SMTP_HOST
    resetMailTransport()
    const ip = freshIp()
    try {
      expect(
        (await processSubmission('contact', validInputs.contact('no-smtp'), headersFor(ip))).ok,
      ).toBe(true)
      expect((await submissionsFor(ip))[0].emailStatus).toBe('skipped')
    } finally {
      process.env.SMTP_HOST = host
    }
  })
})

describe('newsletter double opt-in', () => {
  const links = async (address: string, expected: number) => {
    const found = await messagesTo(address, expected)
    const last = await detail(found[0].ID)
    return {
      confirm: /https?:\/\/[^\s"<]+\/newsletter\/confirm\?t=[^\s"<]+/.exec(last.Text)?.[0] ?? '',
      unsubscribe:
        /https?:\/\/[^\s"<]+\/newsletter\/unsubscribe\?t=[^\s"<]+/.exec(last.Text)?.[0] ?? '',
      count: found.length,
    }
  }
  const tokenOf = (url: string) => decodeURIComponent(new URL(url).searchParams.get('t') ?? '')
  const status = async (address: string) =>
    (
      await payload.find({
        collection: 'subscribers',
        where: { email: { equals: address } },
        overrideAccess: true,
        limit: 1,
      })
    ).docs[0]?.status

  it('goes pending, then confirmed only through the emailed link, then unsubscribed', async () => {
    const address = mail('news-a')
    const ip = freshIp()
    const result = await processSubmission(
      'newsletter',
      { email: address, consent: true, website: '', turnstileToken: 'good' },
      headersFor(ip),
    )
    expect(result.ok).toBe(true)
    expect(await status(address)).toBe('pending')
    expect((await submissionsFor(ip))[0].formType).toBe('newsletter')

    const first = await links(address, 1)
    expect(first.confirm).toContain('/newsletter/confirm?t=')
    expect(first.unsubscribe).toContain('/newsletter/unsubscribe?t=')

    // A confirm link cannot unsubscribe, and an edited link does nothing.
    expect(await newsletter.unsubscribe(tokenOf(first.confirm))).toBe('invalid')
    const tampered = tokenOf(first.confirm).replace(/.$/, (c) => (c === 'a' ? 'b' : 'a'))
    expect(await newsletter.confirmSubscription(tampered)).toBe('invalid')
    expect(await newsletter.confirmSubscription('garbage')).toBe('invalid')
    expect(await status(address)).toBe('pending')

    expect(await newsletter.confirmSubscription(tokenOf(first.confirm))).toBe('confirmed')
    expect(await status(address)).toBe('confirmed')
    expect(await newsletter.confirmSubscription(tokenOf(first.confirm))).toBe('already')

    // Signing up again while confirmed sends nothing new.
    await processSubmission(
      'newsletter',
      { email: address, consent: true, website: '', turnstileToken: 'good' },
      headersFor(freshIp()),
    )
    expect((await messagesTo(address, 2)).length).toBe(1)

    // The unsubscribe link works, never expires, and cannot confirm.
    expect(await newsletter.confirmSubscription(tokenOf(first.unsubscribe))).toBe('invalid')
    expect(await newsletter.unsubscribe(tokenOf(first.unsubscribe))).toBe('unsubscribed')
    expect(await status(address)).toBe('unsubscribed')
    expect(await newsletter.unsubscribe(tokenOf(first.unsubscribe))).toBe('already')
  }, 90_000)

  it('a new signup after unsubscribing starts again and cancels the old links', async () => {
    const address = mail('news-b')
    const submit = () =>
      processSubmission(
        'newsletter',
        { email: address, consent: true, website: '', turnstileToken: 'good' },
        headersFor(freshIp()),
      )
    await submit()
    const first = await links(address, 1)
    await newsletter.confirmSubscription(tokenOf(first.confirm))
    await newsletter.unsubscribe(tokenOf(first.unsubscribe))

    await submit()
    expect(await status(address)).toBe('pending')
    const second = await links(address, 2)
    expect(second.count).toBe(2)
    expect(second.confirm).not.toBe(first.confirm)
    // The first confirm link is dead; the new one works.
    expect(await newsletter.confirmSubscription(tokenOf(first.confirm))).toBe('invalid')
    expect(await newsletter.confirmSubscription(tokenOf(second.confirm))).toBe('confirmed')
  }, 90_000)

  it('confirm links expire after 7 days', async () => {
    const address = mail('news-c')
    await processSubmission(
      'newsletter',
      { email: address, consent: true, website: '', turnstileToken: 'good' },
      headersFor(freshIp()),
    )
    const subscriber = (
      await payload.find({
        collection: 'subscribers',
        where: { email: { equals: address } },
        overrideAccess: true,
        limit: 1,
      })
    ).docs[0]
    const old = newsletter.createToken(
      'confirm',
      { id: subscriber.id, token: subscriber.token! },
      Date.now() - 8 * 24 * 3600 * 1000,
    )
    expect(await newsletter.confirmSubscription(old)).toBe('expired')
    expect(await status(address)).toBe('pending')
  }, 60_000)
})

describe('retention (NFR-PRV-05)', () => {
  it('deletes submissions older than 24 months and stale unconfirmed signups, and keeps the rest', async () => {
    const monthsAgo = (months: number) => {
      const date = new Date()
      date.setMonth(date.getMonth() - months)
      return date.toISOString()
    }
    const make = (name: string, formType: 'contact' | 'pledge', createdAt: string) =>
      payload.create({
        collection: 'form-submissions',
        data: { formType, data: { name: `purge-test-${run} ${name}` }, consent: true, createdAt },
        overrideAccess: true,
        context: { skipAudit: true },
      })
    const old = await make('old contact', 'contact', monthsAgo(25))
    const oldPledge = await make('old pledge', 'pledge', monthsAgo(30))
    const recent = await make('recent', 'contact', monthsAgo(23))

    const donation = await payload.create({
      collection: 'donations',
      data: {
        name: `forms-test-${run} Old donor`,
        phone: '254700000000',
        amount: 1000,
        channel: 'pledge',
        status: 'pledged',
        createdAt: monthsAgo(30),
      },
      overrideAccess: true,
      context: { skipAudit: true },
    })
    const stale = await payload.create({
      collection: 'subscribers',
      data: {
        email: mail('stale'),
        status: 'pending',
        token: 'x',
        createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
      },
      overrideAccess: true,
      context: { skipAudit: true },
    })
    const confirmed = await payload.create({
      collection: 'subscribers',
      data: {
        email: mail('kept-confirmed'),
        status: 'confirmed',
        token: 'y',
        createdAt: new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString(),
      },
      overrideAccess: true,
      context: { skipAudit: true },
    })

    const result = await purgeExpired(payload)
    expect(result.submissions).toBeGreaterThanOrEqual(2)
    expect(result.unconfirmed).toBeGreaterThanOrEqual(1)

    const exists = async (
      collection: 'form-submissions' | 'donations' | 'subscribers',
      id: number,
    ) =>
      payload
        .findByID({ collection, id, overrideAccess: true, disableErrors: true, depth: 0 })
        .then(Boolean)
    expect(await exists('form-submissions', old.id)).toBe(false)
    expect(await exists('form-submissions', oldPledge.id)).toBe(false)
    expect(await exists('form-submissions', recent.id)).toBe(true)
    // Donation records are kept for the accounts, however old.
    expect(await exists('donations', donation.id)).toBe(true)
    expect(await exists('subscribers', stale.id)).toBe(false)
    expect(await exists('subscribers', confirmed.id)).toBe(true)
  }, 60_000)

  it('is registered as a scheduled job that runs nightly', () => {
    const task = payload.config.jobs.tasks?.find((t) => t.slug === 'purgeOldSubmissions')
    expect(task).toBeDefined()
    expect(task?.schedule?.[0]?.cron).toBe('0 0 3 * * *')
    expect(task?.schedule?.[0]?.queue).toBe('default')
  })
})
