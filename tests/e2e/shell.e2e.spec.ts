import { expect, test } from '@playwright/test'

const widths = [360, 768, 1024, 1440]

test.describe('Site shell', () => {
  for (const width of widths) {
    test(`fits without horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/')
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow).toBe(0)
    })
  }

  test('has landmarks and exactly one h1', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toHaveCount(1)
    await expect(page.getByRole('main')).toHaveCount(1)
    await expect(page.getByRole('contentinfo')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('skip link moves focus to the main content', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()
  })

  test('desktop menus open from the keyboard and reach every link', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const about = page.getByRole('button', { name: 'About' })
    await about.focus()
    await page.keyboard.press('Enter')
    await expect(about).toHaveAttribute('aria-expanded', 'true')
    for (const name of ['Who we are', 'Leadership', "Founder's story", 'Governance', 'Impact']) {
      await page.keyboard.press('Tab')
      await expect(page.getByRole('link', { name, exact: true }).first()).toBeFocused()
    }
    await page.keyboard.press('Escape')
    await expect(about).toHaveAttribute('aria-expanded', 'false')
    await expect(about).toBeFocused()
  })

  test('mobile menu traps focus and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/')
    const open = page.getByRole('button', { name: 'Open menu' })
    await open.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      )
      expect(inside).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(open).toBeFocused()
  })

  test('touch targets in the header are at least 44px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/')
    for (const locator of [
      page.getByRole('button', { name: 'Open menu' }),
      page.locator('header').getByRole('link', { name: 'Donate' }),
    ]) {
      const box = await locator.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
    }
  })

  test('footer shows contact links and no registration number', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('link', { name: 'info@enkajienkitaticbo.org' })).toHaveAttribute(
      'href',
      'mailto:info@enkajienkitaticbo.org',
    )
    await expect(footer.getByRole('link', { name: '+254 721 500197' })).toHaveAttribute(
      'href',
      'tel:+254721500197',
    )
    await expect(footer.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
      'href',
      'https://wa.me/254721500197',
    )
    await expect(footer).not.toContainText(/registration|certificate|reg\.? no/i)
    await expect(footer).toContainText(`${new Date().getFullYear()}`)
  })
})
