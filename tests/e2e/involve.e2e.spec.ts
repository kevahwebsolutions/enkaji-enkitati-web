import { expect, test, type APIRequestContext } from '@playwright/test'

const base = 'http://localhost:3000'
const adminEmail = process.env.SEED_ADMIN_EMAIL
const adminPassword = process.env.SEED_ADMIN_PASSWORD

async function adminHeaders(request: APIRequestContext) {
  const login = await request.post(`${base}/api/users/login`, {
    data: { email: adminEmail, password: adminPassword },
  })
  const { token } = (await login.json()) as { token: string }
  return { Authorization: `JWT ${token}` }
}

const empty = {
  donateEnabled: false,
  paybill: null,
  till: null,
  accountReference: null,
  bankName: null,
  bankBranch: null,
  accountName: null,
  accountNumber: null,
}

test.describe('/get-involved', () => {
  test('shows the four roles and the three forms', async ({ page }) => {
    await page.goto(`${base}/get-involved`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    for (const role of [
      'School mentor',
      'Event volunteer',
      'Photographer or storyteller',
      'Skills trainer',
    ]) {
      await expect(page.getByRole('heading', { level: 3, name: role })).toBeVisible()
    }
    for (const id of ['#volunteer', '#school-visit', '#join']) {
      await expect(page.locator(`${id} form`)).toBeVisible()
    }
  })
})

test.describe('/partner', () => {
  test('explains why, shows the plan and tiers, and hides the profile download when absent', async ({
    page,
  }) => {
    await page.goto(`${base}/partner`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Why work with us' })).toBeVisible()
    await expect(page.getByText('Planned annual budget (KES)')).toBeVisible()
    await expect(page.getByText('not money received or spent')).toBeVisible()
    await expect(page.getByText('Platinum').first()).toBeVisible()
    await expect(page.locator('#enquiry form')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Organization profile' })).toHaveCount(0)
  })
})

test.describe('/contact', () => {
  test('lists the public contacts and loads the map only after "Show map"', async ({ page }) => {
    const external: string[] = []
    page.on('request', (r) => {
      if (r.url().includes('openstreetmap.org')) external.push(r.url())
    })
    await page.goto(`${base}/contact`)
    await expect(
      page.locator('#main').getByRole('link', { name: 'info@enkajienkitaticbo.org' }),
    ).toHaveAttribute('href', 'mailto:info@enkajienkitaticbo.org')
    await expect(
      page.locator('#main').getByRole('link', { name: '+254 721 500197' }),
    ).toHaveAttribute('href', 'tel:+254721500197')
    await expect(page.locator('#main').getByRole('link', { name: /WhatsApp us/ })).toHaveAttribute(
      'href',
      'https://wa.me/254721500197',
    )
    await expect(page.locator('main').getByText('Narok, Kenya')).toBeVisible()

    await expect(page.locator('iframe')).toHaveCount(0)
    await page.waitForTimeout(2000)
    expect(external).toEqual([])

    await page.getByRole('button', { name: 'Show map' }).click()
    const frame = page.locator('iframe[title="Map of Narok town"]')
    await expect(frame).toBeVisible()
    await expect(frame).toHaveAttribute(
      'src',
      /openstreetmap\.org\/export\/embed\.html.*marker=-1\.0833/,
    )
    await expect(page.locator('#main form')).toBeVisible()
  })
})

test.describe('/donate', () => {
  test.describe.configure({ mode: 'serial', timeout: 90_000 })
  test.skip(!adminEmail || !adminPassword, 'Admin credentials are not set')

  test.beforeAll(async ({ request }) => {
    const headers = await adminHeaders(request)
    await request.post(`${base}/api/globals/site-settings`, { headers, data: empty })
  })
  test.afterAll(async ({ request }) => {
    const headers = await adminHeaders(request)
    await request.post(`${base}/api/globals/site-settings`, { headers, data: empty })
  })

  test('starts as pledge-only with contact details and no payment details', async ({ page }) => {
    await page.goto(`${base}/donate`)
    await expect(page.getByRole('heading', { name: 'Online giving is coming soon' })).toBeVisible()
    await expect(page.locator('#main').getByRole('link', { name: '+254 721 500197' })).toBeVisible()
    await expect(page.locator('#pledge form')).toBeVisible()
    await expect(page.getByText('Paybill business number')).toHaveCount(0)
    await expect(page.getByText('Account number')).toHaveCount(0)
  })

  test('filling the details in the admin shows them after publish, and clearing reverts', async ({
    page,
    request,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const headers = await adminHeaders(request)
    const save = await request.post(`${base}/api/globals/site-settings`, {
      headers,
      data: {
        donateEnabled: true,
        paybill: '400200',
        accountReference: 'ENKAJI-TEST',
        till: null,
        bankName: 'Test Bank',
        bankBranch: 'Narok Branch',
        accountName: 'Enkaji Test Account',
        accountNumber: '0123456789',
      },
    })
    expect(save.ok(), await save.text()).toBe(true)

    const programs = (await (await request.get(`${base}/api/programs?limit=2&depth=0`)).json()) as {
      docs: Array<{ slug: string }>
    }
    const slug = programs.docs[1].slug

    await page.goto(`${base}/donate?program=${slug}`)
    await expect(page.getByRole('heading', { name: 'Online giving is coming soon' })).toHaveCount(0)
    await expect(page.getByText('400200')).toBeVisible()
    await expect(page.getByText('ENKAJI-TEST')).toBeVisible()
    await expect(page.getByText('Test Bank')).toBeVisible()
    await expect(page.getByText('Narok Branch')).toBeVisible()
    await expect(page.getByText('Enkaji Test Account')).toBeVisible()
    await expect(page.getByText('0123456789')).toBeVisible()
    // Till is empty, so no Till row is drawn.
    await expect(page.getByText('Till number')).toHaveCount(0)

    // The program in the address is preselected in the pledge form.
    await expect(page.locator('#pledge').getByLabel('Which program?')).toHaveValue(slug)

    await page.getByRole('button', { name: 'Copy Paybill business number' }).click()
    await expect(
      page.getByRole('status').filter({ hasText: 'Paybill business number copied' }),
    ).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('400200')

    // Clearing the fields puts the page back to pledge-only.
    const clear = await request.post(`${base}/api/globals/site-settings`, { headers, data: empty })
    expect(clear.ok()).toBe(true)
    await page.goto(`${base}/donate`)
    await expect(page.getByRole('heading', { name: 'Online giving is coming soon' })).toBeVisible()
    await expect(page.getByText('400200')).toHaveCount(0)
    await expect(page.getByText('0123456789')).toHaveCount(0)
  })

  test('switched on with nothing filled in still shows the pledge-only state', async ({
    page,
    request,
  }) => {
    const headers = await adminHeaders(request)
    await request.post(`${base}/api/globals/site-settings`, {
      headers,
      data: { ...empty, donateEnabled: true },
    })
    await page.goto(`${base}/donate`)
    await expect(page.getByRole('heading', { name: 'Online giving is coming soon' })).toBeVisible()
  })

  test('payment details are never in the public API', async ({ request }) => {
    const headers = await adminHeaders(request)
    await request.post(`${base}/api/globals/site-settings`, {
      headers,
      data: { ...empty, donateEnabled: true, paybill: '400200' },
    })
    const body = await (await request.get(`${base}/api/globals/site-settings`)).text()
    expect(body).not.toContain('400200')
  })
})
