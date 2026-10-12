import { expect, test } from '@playwright/test'

test.describe('Home page', () => {
  test('shows the sections in order with one h1', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveText('Empowering Women, Sustaining Futures')

    const headings = await page.locator('main h2').allInnerTexts()
    expect(headings).toEqual([
      'Women leading change in their own communities',
      'Five ways we stand with women and girls',
      'Where we work',
      'Upcoming events',
      'Latest from the community',
      'Local work, global goals',
      'Stand with women and girls in Narok',
    ])
  })

  test('hero has the two calls to action and the Narok eyebrow', async ({ page }) => {
    await page.goto('/')
    const hero = page.locator('section[aria-labelledby="hero-title"]')
    await expect(hero.getByText('Narok County, Kenya')).toBeVisible()
    await expect(hero.getByRole('link', { name: 'Donate' })).toHaveAttribute('href', '/donate')
    await expect(hero.getByRole('link', { name: 'Partner with us' })).toHaveAttribute(
      'href',
      '/partner',
    )
  })

  test('hero mark is inline vector, so it is not an image candidate for LCP', async ({ page }) => {
    await page.goto('/')
    const hero = page.locator('section[aria-labelledby="hero-title"]')
    await expect(hero.locator('svg[role="img"] path').first()).toBeAttached()
    await expect(hero.locator('img, svg image')).toHaveCount(0)
  })

  test('lists five programs with SDG badges', async ({ page }) => {
    await page.goto('/')
    const section = page.locator('section[aria-labelledby="programs-title"]')
    await expect(section.locator('li > div > a[href^="/programs/"]')).toHaveCount(5)
    await expect(section.getByText('SDG 5').first()).toBeAttached()
  })

  test('shows three upcoming events and three stories', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.locator('section[aria-labelledby="events-title"] a[href^="/events/"]'),
    ).toHaveCount(3)
    await expect(
      page.locator('section[aria-labelledby="stories-title"] a[href^="/news/"]'),
    ).toHaveCount(3)
  })

  test('has the map, the SDG strip and hides partners when there are none', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('img', { name: 'Map of Narok County, Kenya' })).toBeVisible()
    await expect(page.locator('section[aria-labelledby="sdg-title"] li')).toHaveCount(6)
    await expect(page.locator('section[aria-labelledby="partners-title"]')).toHaveCount(0)
  })

  test('ends with the green call-to-action band', async ({ page }) => {
    await page.goto('/')
    const band = page.locator('section[aria-labelledby="cta-title"]')
    await expect(band.getByRole('link', { name: 'Donate' })).toHaveAttribute('href', '/donate')
    await expect(band.getByRole('link', { name: 'Get involved' })).toHaveAttribute(
      'href',
      '/get-involved',
    )
  })
})
