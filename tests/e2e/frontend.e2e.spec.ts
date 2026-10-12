import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('home page renders the hero headline', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Enkaji Enkitati CBO/)
    await expect(page.locator('h1').first()).toHaveText('Empowering Women, Sustaining Futures')
  })
})
