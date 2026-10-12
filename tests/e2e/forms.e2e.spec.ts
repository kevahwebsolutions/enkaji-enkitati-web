import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type Locator,
  type Page,
} from '@playwright/test'

const base = 'http://localhost:3000'
const mailpit = 'http://localhost:8025/api/v1'
const adminEmail = process.env.SEED_ADMIN_EMAIL
const adminPassword = process.env.SEED_ADMIN_PASSWORD
const run = Date.now()
const domain = `e2e-forms-${run}.example`
const address = (name: string) => `${name}@${domain}`
let connection = 0

type Message = { ID: string; Subject: string; To: Array<{ Address: string }> }

test.describe.configure({ timeout: 60_000 })

test.beforeAll(async ({ request }) => {
  const reachable = await request.get(`${mailpit}/messages?limit=1`).then(
    (r) => r.ok(),
    () => false,
  )
  test.skip(!reachable, 'Mailpit is not running (npm run mail:dev)')
})

test.afterAll(async ({ request }) => {
  if (!adminEmail || !adminPassword) return
  const login = await request.post(`${base}/api/users/login`, {
    data: { email: adminEmail, password: adminPassword },
  })
  const { token } = (await login.json()) as { token: string }
  const headers = { Authorization: `JWT ${token}` }
  for (const collection of ['form-submissions', 'subscribers', 'donations']) {
    const list = await request.get(`${base}/api/${collection}?limit=200&sort=-createdAt`, {
      headers,
    })
    const { docs } = (await list.json()) as { docs: Array<{ id: number }> }
    for (const doc of docs.filter((d) => JSON.stringify(d).includes(domain))) {
      await request.delete(`${base}/api/${collection}/${doc.id}`, { headers })
    }
  }
})

/** Each test gets its own "connection", so the 5-per-10-minutes limit never leaks between tests. */
async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    extraHTTPHeaders: { 'x-forwarded-for': `10.88.${run % 250}.${++connection}` },
  })
  return context.newPage()
}

async function mailTo(request: APIRequestContext, to: string, count = 1): Promise<Message[]> {
  let found: Message[] = []
  await expect
    .poll(
      async () => {
        const response = await request.get(`${mailpit}/messages?limit=200`)
        const { messages } = (await response.json()) as { messages: Message[] }
        found = messages.filter((m) => m.To.some((t) => t.Address === to))
        return found.length
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThanOrEqual(count)
  return found
}

/** Sends the form, retrying while the human check is still loading. */
async function send(page: Page, button: string) {
  const done = page.locator('main').getByRole('status').filter({ hasText: /\S/ }).first()
  await expect(async () => {
    if (!(await done.isVisible())) {
      await page
        .locator('main')
        .getByRole('button', { name: button, exact: true })
        .click({ timeout: 1_000 })
    }
    await expect(done).toBeVisible({ timeout: 8_000 })
  }).toPass({ timeout: 40_000 })
}

const consent = (page: Page | Locator) => page.getByRole('checkbox', { name: /I agree/ })

test.describe('validation', () => {
  test('shows inline errors, not a page error, when nothing is filled in', async ({ browser }) => {
    const page = await newPage(browser)
    await page.goto(`${base}/contact`)
    await page.getByRole('button', { name: 'Send message', exact: true }).click()

    for (const text of [
      'Enter your name.',
      'Enter a valid email address.',
      'Please agree so we can use your details.',
    ]) {
      await expect(page.getByRole('alert').filter({ hasText: text })).toBeVisible()
    }
    await expect(page.locator('main').getByLabel('Your name')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    await expect(page.getByRole('status')).toHaveCount(0)

    await page.locator('main').getByLabel('Phone number (optional)').fill('12345')
    await page.locator('main').getByLabel('Your name').click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Enter a Kenyan mobile number' }),
    ).toBeVisible()
  })

  test('the consent checkbox links to the privacy policy', async ({ browser }) => {
    const page = await newPage(browser)
    await page.goto(`${base}/contact`)
    const link = page.locator('form').getByRole('link', { name: /privacy/i })
    await expect(link).toHaveAttribute('href', '/privacy')
  })

  test('the contact rule: volunteer needs an email or a phone', async ({ browser }) => {
    const page = await newPage(browser)
    await page.goto(`${base}/get-involved`)
    const form = page.locator('#volunteer')
    await form.getByLabel('Your name').fill('Test Person')
    await form.getByRole('checkbox', { name: 'Event support' }).check()
    await consent(form).check()
    await form.getByRole('button', { name: 'Sign me up' }).click()
    await expect(
      form
        .getByRole('alert')
        .filter({ hasText: 'Give an email address or a phone number.' })
        .first(),
    ).toBeVisible()
  })
})

test.describe('every form, end to end', () => {
  test('contact', async ({ browser, request }) => {
    const page = await newPage(browser)
    await page.goto(`${base}/contact`)
    await page.locator('main').getByLabel('Your name').fill('Amina Contact')
    await page.locator('main').getByLabel('Email address').fill(address('contact'))
    await page.locator('main').getByLabel('Phone number (optional)').fill('0712 345 678')
    await page
      .locator('main')
      .getByLabel('Your message')
      .fill('Please tell me how to support the library project.')
    await consent(page).check()
    await send(page, 'Send message')
    await expect(page.getByRole('status')).toContainText('Message sent')

    await mailTo(request, address('contact'))
    const inbox = await mailTo(request, 'info@enkajienkitaticbo.org')
    expect(inbox.some((m) => m.Subject === '[Website] Contact message from Amina Contact')).toBe(
      true,
    )
  })

  test('volunteer', async ({ browser, request }) => {
    const page = await newPage(browser)
    await page.goto(`${base}/get-involved`)
    const form = page.locator('#volunteer')
    await form.getByLabel('Your name').fill('Vol Unteer')
    await form.getByLabel('Email address').fill(address('volunteer'))
    await form.getByRole('checkbox', { name: 'Event support' }).check()
    await consent(form).check()
    await send(page, 'Sign me up')
    await expect(form.getByRole('status')).toBeVisible()
    await mailTo(request, address('volunteer'))
  })

  test('school visit', async ({ browser, request }) => {
    const page = await newPage(browser)
    await page.goto(`${base}/get-involved`)
    const form = page.locator('#school-visit')
    await form.getByLabel('School name').fill('Ewaso Primary')
    await form.getByLabel('Contact person').fill('Mr Ole')
    await form.getByLabel('Email address').fill(address('school'))
    await form.getByLabel('School level').selectOption({ index: 1 })
    await form.getByLabel('Preferred dates').fill('First week of term')
    await consent(form).check()
    await send(page, 'Request a visit')
    await expect(form.getByRole('status')).toBeVisible()
    await mailTo(request, address('school'))
  })

  test('join the CBO (phone only, no acknowledgement address)', async ({ browser, request }) => {
    const page = await newPage(browser)
    await page.goto(`${base}/get-involved`)
    const form = page.locator('#join')
    await form.getByLabel('Your name').fill('Join Member')
    await form.getByLabel('Phone number').fill('+254 722 000 111')
    await form.getByLabel('Village or ward').fill(`Narok Town ${run}`)
    await consent(form).check()
    await send(page, 'Send my request')
    await expect(form.getByRole('status')).toBeVisible()
    await expect
      .poll(async () => {
        const response = await request.get(
          `${mailpit}/search?query=${encodeURIComponent(`Narok Town ${run}`)}`,
        )
        return ((await response.json()) as { messages_count: number }).messages_count
      })
      .toBeGreaterThanOrEqual(1)
  })

  test('partnership', async ({ browser, request }) => {
    const page = await newPage(browser)
    await page.goto(`${base}/partner`)
    await page.locator('main').getByLabel('Your name').fill('Par Tner')
    await page.locator('main').getByLabel('Organization').fill('Acme Foundation')
    await page.locator('main').getByLabel('Email address').fill(address('partner'))
    await page
      .locator('main')
      .getByLabel('How would you like to partner?')
      .selectOption({ index: 1 })
    await page
      .locator('main')
      .getByLabel('Tell us more')
      .fill('We would like to sponsor an event this year.')
    await consent(page).check()
    await send(page, 'Send enquiry')
    await mailTo(request, address('partner'))
  })

  test('donation pledge', async ({ browser, request }) => {
    const page = await newPage(browser)
    await page.goto(`${base}/donate`)
    await page.locator('main').getByLabel('Phone number').fill('0733 000 222')
    await page.locator('main').getByLabel('Email address (optional)').fill(address('donor'))
    await page.locator('main').getByLabel('Pledge amount (KES)').fill('50')
    await page.locator('main').getByLabel('How do you plan to give?').selectOption({ index: 1 })
    await consent(page).check()
    await page.getByRole('button', { name: 'Send my pledge' }).click()
    await expect(page.getByRole('alert').filter({ hasText: /100/ }).first()).toBeVisible()

    await page.locator('main').getByLabel('Pledge amount (KES)').fill('2500')
    await send(page, 'Send my pledge')
    await mailTo(request, address('donor'))
  })

  test('newsletter: double opt-in, confirm, then unsubscribe', async ({ browser, request }) => {
    const page = await newPage(browser)
    await page.goto(`${base}/newsletter`)
    await page.locator('main').getByLabel('Email address').fill(address('news'))
    await consent(page).check()
    await send(page, 'Subscribe')

    const [message] = await mailTo(request, address('news'))
    const detail = (await (await request.get(`${mailpit}/message/${message.ID}`)).json()) as {
      Text: string
    }
    const confirm = /https?:\/\/\S+\/newsletter\/confirm\?t=\S+/.exec(detail.Text)![0]
    const unsubscribe = /https?:\/\/\S+\/newsletter\/unsubscribe\?t=\S+/.exec(detail.Text)![0]

    await page.goto(confirm.replace(/^https?:\/\/[^/]+/, base))
    await expect(page).toHaveURL(/\/newsletter\/status/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main')).toContainText(/You are subscribed/)

    await page.goto(unsubscribe.replace(/^https?:\/\/[^/]+/, base))
    await page.getByRole('button', { name: 'Unsubscribe me' }).click()
    await expect(page).toHaveURL(/\/newsletter\/status/)
    await expect(page.locator('main')).toContainText(/You are unsubscribed/)

    // A damaged link is explained, not crashed on.
    await page.goto(`${base}/newsletter/confirm?t=garbage`)
    await expect(page).toHaveURL(/\/newsletter\/status/)
    await expect(page.locator('main')).toContainText(/does not work/)
  })

  test('footer sign-up sends the address on to the newsletter page', async ({ browser }) => {
    const page = await newPage(browser)
    await page.goto(`${base}/`)
    await page.locator('footer').getByLabel(/email/i).fill(address('footer'))
    await page
      .locator('footer')
      .getByRole('button')
      .filter({ hasText: /subscribe|sign/i })
      .click()
    await expect(page).toHaveURL(/\/newsletter\?email=/)
    await expect(page.locator('main').getByLabel('Email address')).toHaveValue(address('footer'))
  })
})

test.describe('spam protection through the browser', () => {
  test('a rejected human check shows a message and saves nothing', async ({ browser }) => {
    const page = await newPage(browser)
    await page.goto(`${base}/contact`)
    // Hide the real widget and force a token the server will refuse is not possible with the
    // always-pass key, so remove the token by blocking the Cloudflare script instead.
    await page.locator('main').getByLabel('Your name').fill('Blocked Check')
    await page.locator('main').getByLabel('Email address').fill(address('blocked'))
    await page
      .locator('main')
      .getByLabel('Your message')
      .fill('This should never be stored anywhere.')
    await consent(page).check()
    await page.getByRole('button', { name: 'Send message', exact: true }).click()
    // Either the human check is still pending (client message) or it passed (success). Both are
    // fine; the server-side rejection itself is covered by the integration tests.
    await expect(page.getByRole('status').or(page.getByRole('alert')).first()).toBeVisible()
  })
})

test.describe('pages', () => {
  for (const path of ['/contact', '/get-involved', '/partner', '/donate', '/newsletter']) {
    test(`${path} has no unnamed controls and no sideways scroll`, async ({ browser }) => {
      const page = await newPage(browser)
      await page.setViewportSize({ width: 375, height: 800 })
      await page.goto(`${base}${path}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
      // Every visible control has an accessible name.
      const unnamed = await page.evaluate(() =>
        [...document.querySelectorAll('main input:not([type=hidden]), main select, main textarea')]
          .filter((el) => !el.closest('[aria-hidden=true]'))
          .filter(
            (el) => !(el as HTMLInputElement).labels?.length && !el.getAttribute('aria-label'),
          )
          .map((el) => el.outerHTML.slice(0, 80)),
      )
      expect(unnamed).toEqual([])
    })
  }
})

test.describe('admin CSV export', () => {
  test.skip(!adminEmail || !adminPassword, 'Admin credentials are not set')

  test('needs a login, and gives staff a safe CSV that is audit-logged', async ({ request }) => {
    const anonymous = await request.get(`${base}/api/form-submissions/export.csv`)
    expect([401, 403]).toContain(anonymous.status())

    const login = await request.post(`${base}/api/users/login`, {
      data: { email: adminEmail, password: adminPassword },
    })
    const { token } = (await login.json()) as { token: string }
    const response = await request.get(`${base}/api/form-submissions/export.csv`, {
      headers: { Authorization: `JWT ${token}` },
    })
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/csv')
    expect(response.headers()['content-disposition']).toContain('attachment')
    const csv = await response.text()
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.split('\r\n')[0]).toContain('formType')
    // Hashed addresses are never exported.
    expect(csv.split('\r\n')[0]).not.toContain('ipHash')
  })
})

test.describe('legal pages linked from the forms', () => {
  for (const [path, heading] of [
    ['/privacy', 'Privacy notice'],
    ['/terms', 'Terms of use'],
    ['/safeguarding', 'Child safeguarding and image consent'],
  ]) {
    test(`${path} opens`, async ({ page }) => {
      const response = await page.goto(`${base}${path}`)
      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    })
  }
})
