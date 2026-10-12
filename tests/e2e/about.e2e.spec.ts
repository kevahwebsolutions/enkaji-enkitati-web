import { expect, test } from '@playwright/test'

const pages = ['/about', '/about/leadership', '/about/founder', '/about/governance']

test.describe('About pages', () => {
  for (const path of pages) {
    test(`${path} has one h1, a breadcrumb and no horizontal scroll`, async ({ page }) => {
      for (const width of [360, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)
        await expect(page.locator('h1')).toHaveCount(1)
        await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible()
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        )
        expect(overflow).toBe(0)
      }
    })

    test(`${path} shows no personal phone, ID or KRA number`, async ({ page }) => {
      await page.goto(path)
      // The footer carries the CBO's own public number, which is allowed.
      const text = await page.locator('main').innerText()
      expect(text).not.toMatch(/\+?254[\s-]?\d{3}[\s-]?\d{6}/)
      expect(text).not.toMatch(/\b0[17]\d{2}[\s-]?\d{6}\b/)
      expect(text).not.toMatch(/\b\d{8}\b/)
      expect(text).not.toMatch(/\b[AP]\d{9}[A-Z]\b/)
    })
  }

  test('/about has the vision, mission, values, objectives, area and approach', async ({
    page,
  }) => {
    await page.goto('/about')
    const headings = await page.locator('main h2').allInnerTexts()
    expect(headings).toEqual(
      expect.arrayContaining([
        'Our vision and mission',
        'What we value',
        'Our objectives',
        'Where we work',
        'Our approach',
      ]),
    )
    await expect(page.locator('section[aria-labelledby="objectives-title"] li')).toHaveCount(6)
    await expect(page.locator('section[aria-labelledby="values-title"] li')).toHaveCount(6)
    await expect(page.locator('section[aria-labelledby="approach-title"] li')).not.toHaveCount(0)
  })

  test('/about/leadership shows cards or the consent message, never contact details', async ({
    page,
  }) => {
    await page.goto('/about/leadership')
    const cards = page.locator('main article')
    const count = await cards.count()
    if (count === 0) {
      await expect(page.getByText('once each member has agreed')).toBeVisible()
    } else {
      await expect(cards.first().getByRole('heading')).toBeVisible()
      await expect(page.locator('main a[href^="tel:"], main a[href^="mailto:"]')).toHaveCount(0)
    }
  })

  test('/about/founder is a long-form article with a pull quote and a bio card', async ({
    page,
  }) => {
    await page.goto('/about/founder')
    await expect(page.locator('h1')).toHaveText('My Story as a Young Maasai Girl')
    await expect(page.getByText('By Caren Naeku Dapash')).toBeVisible()
    await expect(page.locator('figure blockquote')).toHaveText(
      'Change begins with courage, and courage begins with a single voice.',
    )
    await expect(page.getByRole('heading', { name: 'About the founder' })).toBeVisible()
    const measure = await page
      .locator('.prose-longform')
      .first()
      .evaluate((el) => el.clientWidth)
    expect(measure).toBeLessThanOrEqual(900)
  })

  test('/about/governance lists the rules and the two-signature rule', async ({ page }) => {
    await page.goto('/about/governance')
    for (const name of ['Committee and meetings', 'Money and records', 'Reporting']) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    }
    await expect(page.getByText('two signatories')).toBeVisible()
  })
})
