import { expect, test } from '@playwright/test'

const slugs = [
  'women-economic-empowerment',
  'girls-dignity-and-health',
  'education-and-mentorship',
  'community-development',
  'vulnerable-households',
]

test.describe('Programs', () => {
  test('/programs lists the five programs in order', async ({ page }) => {
    await page.goto('/programs')
    await expect(page.locator('h1')).toHaveText('Our programs')
    const hrefs = await page
      .locator('main li a[href^="/programs/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    expect(hrefs).toEqual(slugs.map((slug) => `/programs/${slug}`))
  })

  for (const slug of slugs) {
    test(`/programs/${slug} has one h1, the challenge, a CTA to fund it and no horizontal scroll`, async ({
      page,
    }) => {
      for (const width of [360, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`/programs/${slug}`)
        await expect(page.locator('h1')).toHaveCount(1)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        )
        expect(overflow).toBe(0)
      }
      await expect(page.getByRole('heading', { name: 'The challenge' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Fund this program' })).toHaveAttribute(
        'href',
        `/donate?program=${slug}`,
      )
    })
  }

  test('an unknown program is a 404', async ({ page }) => {
    const response = await page.goto('/programs/does-not-exist')
    expect(response?.status()).toBe(404)
  })

  test('Education and Mentorship shows both topic lists in tabs', async ({ page }) => {
    await page.goto('/programs/education-and-mentorship')
    const primary = page.getByRole('tab', { name: 'Primary school' })
    const high = page.getByRole('tab', { name: 'High school' })
    await expect(primary).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Dream Big Early')).toBeVisible()
    await high.click()
    await expect(high).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Purpose and Vision in Life')).toBeVisible()
    await expect(page.getByText('Dream Big Early')).toBeHidden()
    // Keyboard: arrow keys move between tabs.
    await high.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(primary).toBeFocused()
  })

  test('related events and posts appear by program relation', async ({ page }) => {
    await page.goto('/programs/education-and-mentorship')
    await expect(page.getByRole('heading', { name: /^Events for/ })).toBeVisible()
    await expect(page.getByText('Ignite Dreams primary school mentorship visit')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'From this program' })).toBeVisible()
    // Program pages for programs with no gallery do not show an empty strip.
    await expect(page.getByRole('heading', { name: 'In pictures' })).toHaveCount(0)
  })
})

test.describe('Impact', () => {
  test('has the SDG table, the targets labelled as targets and the planned budget chart', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/impact')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('table')).toBeVisible()
    await expect(page.getByRole('heading', { name: '2026–2030 targets' })).toBeVisible()
    await expect(page.getByText('Planned annual budget (KES)')).toBeVisible()
    await expect(page.getByText('Total planned: KES 1,570,000')).toBeVisible()
  })

  test('stacks the SDG alignment as cards under 640px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/impact')
    await expect(page.locator('table')).toBeHidden()
    await expect(page.locator('section[aria-labelledby="sdg-title"] ul li').first()).toBeVisible()
  })

  test('never presents a target or budget as an achieved result', async ({ page }) => {
    await page.goto('/impact')
    const text = (await page.locator('main').innerText()).toLowerCase()
    // Plans are always framed as plans.
    expect(text).toContain('plans, not results')
    expect(text).toContain('not money received or spent')
    // No claim of delivery or spending in the first person.
    for (const phrase of [
      'we have reached',
      'we have achieved',
      'we have delivered',
      'we have raised',
      'we have spent',
      'beneficiaries reached',
      'girls reached',
      'women reached',
    ]) {
      expect(text).not.toContain(phrase)
    }
  })
})
