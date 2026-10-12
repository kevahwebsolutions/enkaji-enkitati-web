import { expect, test, type APIRequestContext } from '@playwright/test'

const base = 'http://localhost:3000'
const adminEmail = process.env.SEED_ADMIN_EMAIL
const adminPassword = process.env.SEED_ADMIN_PASSWORD

const paragraph = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        children: [
          { type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' },
        ],
      },
    ],
  },
})

/** Signs in to the admin API so a test can create and remove its own posts. */
async function admin(request: APIRequestContext) {
  const response = await request.post(`${base}/api/users/login`, {
    data: { email: adminEmail, password: adminPassword },
  })
  const { token } = (await response.json()) as { token: string }
  const headers = { Authorization: `JWT ${token}` }
  return {
    async createPost(data: Record<string, unknown>): Promise<number> {
      const created = await request.post(`${base}/api/posts`, {
        headers,
        data: {
          excerpt: 'An e2e post.',
          category: 'News',
          _status: 'published',
          publishedAt: new Date().toISOString(),
          ...data,
        },
      })
      const body = (await created.json()) as { doc?: { id: number }; errors?: unknown }
      expect(body.doc?.id, JSON.stringify(body.errors)).toBeTruthy()
      return body.doc!.id
    },
    async deletePost(id: number): Promise<void> {
      await request.delete(`${base}/api/posts/${id}`, { headers })
    },
  }
}

test.describe('News list', () => {
  test('shows the posts, category chips, search box and RSS link', async ({ page }) => {
    await page.goto('/news')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('search').getByLabel('Search news and stories')).toBeVisible()
    for (const name of ['All', 'News', 'Stories', 'Press', 'Reports']) {
      await expect(
        page
          .getByRole('navigation', { name: 'Filter by category' })
          .getByRole('link', { name, exact: true }),
      ).toBeVisible()
    }
    await expect(page.getByRole('link', { name: 'Subscribe with RSS' })).toHaveAttribute(
      'href',
      '/news/rss.xml',
    )
    await expect(page.locator('main li a[href^="/news/"]').first()).toBeVisible()
  })

  test('filters by category through the URL', async ({ page }) => {
    await page.goto('/news')
    await page
      .getByRole('navigation', { name: 'Filter by category' })
      .getByRole('link', { name: 'Stories' })
      .click()
    await expect(page).toHaveURL(/category=Stories/)
    await expect(page.getByText('Our first table banking cycle has begun')).toBeVisible()
    await expect(page.getByText('Welcome to Enkaji Enkitati CBO')).toHaveCount(0)
    await expect(page.getByRole('status').filter({ hasText: 'in Stories' })).toBeVisible()
  })

  test('searches as you type, after a pause, and combines with the category', async ({ page }) => {
    await page.goto('/news')
    const box = page.getByRole('search').getByLabel('Search news and stories')
    await box.pressSequentially('table banking', { delay: 30 })
    await expect(page).toHaveURL(/q=table\+banking/)
    await expect(page.getByText('Our first table banking cycle has begun')).toBeVisible()
    await expect(
      page.getByRole('status').filter({ hasText: '1 result for “table banking”' }),
    ).toBeVisible()
    await expect(page.getByText('A pad can keep a girl in school')).toHaveCount(0)

    // The category chip keeps the search term.
    const filter = page.getByRole('navigation', { name: 'Filter by category' })
    await filter.getByRole('link', { name: 'Stories' }).click()
    await expect(page).toHaveURL(/category=Stories/)
    await expect(page).toHaveURL(/q=table\+banking/)
    await expect(page.getByText('Our first table banking cycle has begun')).toBeVisible()

    // The same search in another category finds nothing, and says so.
    await filter.getByRole('link', { name: 'News', exact: true }).click()
    await expect(page.getByText('No posts match. Try a different word or category.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Show all posts' })).toBeVisible()

    // Clearing the box returns to the full list for the category.
    await page.getByRole('button', { name: 'Clear search' }).click()
    await expect(page).not.toHaveURL(/q=/)
    await expect(page).toHaveURL(/category=News/)
  })

  test('finds words inside the story text and matches word starts', async ({ page }) => {
    await page.goto('/news?q=menstr')
    await expect(page.getByText('A pad can keep a girl in school')).toBeVisible()
  })

  test('works without JavaScript through the search form', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(`${base}/news`)
    await page.getByLabel('Search news and stories').fill('constitution')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page).toHaveURL(/q=constitution/)
    await expect(page.getByText('Welcome to Enkaji Enkitati CBO')).toBeVisible()
    await context.close()
  })

  test('paginates nine to a page, and the links keep search and category', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000)
    test.skip(!adminEmail, 'needs the seed admin credentials')
    const api = await admin(request)
    const run = Date.now()
    const token = `lemurword${run}`
    const created: number[] = []
    try {
      for (let n = 0; n < 11; n++) {
        created.push(
          await api.createPost({
            title: `Pagination post ${n} ${token}`,
            slug: `pagination-post-${run}-${n}`,
            category: n < 4 ? 'Press' : 'Stories',
            body: paragraph(`Body text for ${token} number ${n}.`),
          }),
        )
      }

      await page.goto(`/news?q=${token}`)
      await expect(page.getByRole('status').filter({ hasText: '11 results' })).toBeVisible()
      await expect(page.locator('main li a[href^="/news/"]')).toHaveCount(9)
      const nav = page.getByRole('navigation', { name: 'News pages' })
      await expect(nav.getByRole('link', { name: 'Page 1' })).toHaveAttribute(
        'aria-current',
        'page',
      )

      await nav.getByRole('link', { name: 'Page 2' }).click()
      await expect(page).toHaveURL(new RegExp(`page=2`))
      await expect(page).toHaveURL(new RegExp(`q=${token}`))
      await expect(page.locator('main li a[href^="/news/"]')).toHaveCount(2)

      // A category narrows the search and starts again at page 1.
      await page
        .getByRole('navigation', { name: 'Filter by category' })
        .getByRole('link', { name: 'Press' })
        .click()
      await expect(page).not.toHaveURL(/page=/)
      await expect(page).toHaveURL(/category=Press/)
      await expect(page).toHaveURL(new RegExp(`q=${token}`))
      await expect(page.getByRole('status').filter({ hasText: '4 results' })).toBeVisible()
      await expect(page.getByRole('navigation', { name: 'News pages' })).toHaveCount(0)
    } finally {
      for (const id of created) await api.deletePost(id)
    }
  })
})

test.describe('News post', () => {
  const slug = 'our-first-table-banking-cycle'

  test('shows cover, category, date, reading time and the story', async ({ page }) => {
    await page.goto(`/news/${slug}`)
    await expect(page.locator('h1')).toHaveText('Our first table banking cycle has begun')
    await expect(page.getByText('Stories').first()).toBeVisible()
    await expect(page.getByText('3 August 2026')).toBeVisible()
    await expect(page.getByText(/\d+ min read/)).toBeVisible()
    await expect(page.locator('article img').first()).toBeVisible()
    await expect(page.locator('article')).toContainText('Savings change lives slowly and surely')
    await expect(page.getByRole('link', { name: 'Women Economic Empowerment' })).toBeVisible()
  })

  test('has share links, a working copy-link button and loads no third-party script', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const foreign: string[] = []
    page.on('request', (request) => {
      const host = new URL(request.url()).hostname
      if (!['localhost', '127.0.0.1'].includes(host)) foreign.push(request.url())
    })
    await page.goto(`/news/${slug}`)

    const share = page.getByRole('list', { name: 'Share this story' })
    await expect(share.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\/\?text=/,
    )
    await expect(share.getByRole('link', { name: /Facebook/ })).toHaveAttribute(
      'href',
      /facebook\.com\/sharer/,
    )
    await expect(share.getByRole('link', { name: /^X/ })).toHaveAttribute(
      'href',
      /x\.com\/intent\/post/,
    )
    await expect(share.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute(
      'href',
      /linkedin\.com\/sharing/,
    )
    for (const link of await share.getByRole('link').all()) {
      await expect(link).toHaveAttribute('rel', /noopener/)
      await expect(link).toHaveAttribute('target', '_blank')
    }

    await share.getByRole('button', { name: 'Copy link' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Link copied' })).toHaveCount(1)
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
      /\/news\/our-first-table-banking-cycle$/,
    )

    expect(foreign, `third-party requests: ${foreign.join(', ')}`).toEqual([])
    await expect(page.locator('script[src]:not([src^="/"])')).toHaveCount(0)
  })

  test('includes Article structured data and related posts', async ({ page }) => {
    await page.goto(`/news/${slug}`)
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
    const data = JSON.parse(raw ?? '{}') as Record<string, unknown>
    expect(data['@type']).toBe('Article')
    expect(data.headline).toBe('Our first table banking cycle has begun')
    expect(data.datePublished).toBeTruthy()
    await expect(page.getByRole('heading', { name: 'Related stories' })).toBeVisible()
    await expect(page.locator('section[aria-labelledby="related-title"] li')).not.toHaveCount(0)
  })

  test('an unknown post is a 404', async ({ page }) => {
    expect((await page.goto('/news/not-a-post'))?.status()).toBe(404)
  })
})

test.describe('RSS', () => {
  test('serves a valid RSS 2.0 feed of the newest posts', async ({ request }) => {
    const response = await request.get(`${base}/news/rss.xml`)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/rss+xml')
    const xml = await response.text()
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('rel="self"')
    expect(xml).toContain('<item>')
    expect(xml).toContain('/news/our-first-table-banking-cycle</link>')
    expect(xml).toMatch(
      /<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT<\/pubDate>/,
    )
    // Drafts and unpublished posts never appear.
    expect((xml.match(/<item>/g) ?? []).length).toBeGreaterThanOrEqual(4)
  })

  test('is advertised in the page head for feed readers', async ({ page }) => {
    await page.goto('/news')
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
      'href',
      /\/news\/rss\.xml$/,
    )
  })
})
