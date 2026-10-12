import { expect, test, type Page } from '@playwright/test'

const album = '/gallery/programs-in-pictures'

const counter = (page: Page) => page.getByRole('dialog').getByText(/^\d+ \/ \d+$/)

test.describe('Gallery', () => {
  test('lists the albums with their photo counts', async ({ page }) => {
    await page.goto('/gallery')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('link', { name: 'Our programs in pictures' })).toBeVisible()
    await expect(page.getByText('6 photos')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Menstrual Hygiene Day 2026' })).toBeVisible()
  })

  test('an album shows a masonry grid of lazy-loaded thumbnails and links to its event', async ({
    page,
  }) => {
    await page.goto('/gallery/menstrual-hygiene-day-2026')
    await expect(page.getByRole('link', { name: /Event: Menstrual Hygiene Day/ })).toHaveAttribute(
      'href',
      '/events/menstrual-hygiene-day-2026',
    )
    await page.goto(album)
    const thumbnails = page.locator('main ul button img')
    await expect(thumbnails).toHaveCount(6)
    for (const img of await thumbnails.all()) {
      await expect(img).toHaveAttribute('loading', 'lazy')
    }
    const columns = await page
      .locator('main ul')
      .first()
      .evaluate((el) => getComputedStyle(el).columnCount)
    expect(Number(columns)).toBeGreaterThan(1)
  })

  test('the lightbox works with the keyboard alone', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(album)

    // Reach the first photo with Tab only, then open it with Enter.
    const first = page.getByRole('button', { name: /^Open photo 1 of 6/ })
    for (let i = 0; i < 40 && !(await first.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab')
    }
    await expect(first).toBeFocused()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAccessibleName(/Our programs in pictures, photo 1 of 6/)
    await expect(counter(page)).toHaveText('1 / 6')
    await expect(dialog.locator('img[alt]:not([alt=""])').first()).toBeVisible()

    // Arrow keys move through the album and wrap around.
    await page.keyboard.press('ArrowRight')
    await expect(counter(page)).toHaveText('2 / 6')
    await page.keyboard.press('ArrowRight')
    await expect(counter(page)).toHaveText('3 / 6')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await expect(counter(page)).toHaveText('1 / 6')
    await page.keyboard.press('ArrowLeft')
    await expect(counter(page)).toHaveText('6 / 6')
    await page.keyboard.press('Home')
    await expect(counter(page)).toHaveText('1 / 6')
    await page.keyboard.press('End')
    await expect(counter(page)).toHaveText('6 / 6')

    // Focus stays trapped inside the dialog however long you press Tab.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      expect(
        await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))),
      ).toBe(true)
    }

    // Escape closes it and focus returns to the thumbnail of the photo that was showing.
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: /^Open photo 6 of 6/ })).toBeFocused()
  })

  test('the Close and arrow buttons work with the mouse too', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(album)
    await page.getByRole('button', { name: /^Open photo 2 of 6/ }).click()
    await expect(counter(page)).toHaveText('2 / 6')
    await page.getByRole('button', { name: 'Next photo' }).first().click()
    await expect(counter(page)).toHaveText('3 / 6')
    await page.getByRole('button', { name: 'Previous photo' }).first().click()
    await expect(counter(page)).toHaveText('2 / 6')
    await page.getByRole('button', { name: 'Close photo viewer' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('swiping changes photo on a touch screen', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 800 },
      hasTouch: true,
      isMobile: true,
    })
    const page = await context.newPage()
    await page.goto(`http://localhost:3000${album}`)
    await page.getByRole('button', { name: /^Open photo 1 of 6/ }).tap()
    await expect(counter(page)).toHaveText('1 / 6')

    const swipe = (fromX: number, toX: number) =>
      page.evaluate(
        ({ fromX, toX }) => {
          const target = document.querySelector('[role="dialog"] figure') as HTMLElement
          const touch = (x: number) =>
            new Touch({ identifier: 1, target, clientX: x, clientY: 300 })
          target.dispatchEvent(
            new TouchEvent('touchstart', {
              bubbles: true,
              cancelable: true,
              touches: [touch(fromX)],
              changedTouches: [touch(fromX)],
            }),
          )
          target.dispatchEvent(
            new TouchEvent('touchend', {
              bubbles: true,
              cancelable: true,
              touches: [],
              changedTouches: [touch(toX)],
            }),
          )
        },
        { fromX, toX },
      )

    await swipe(300, 80)
    await expect(counter(page)).toHaveText('2 / 6')
    await swipe(80, 300)
    await expect(counter(page)).toHaveText('1 / 6')
    // A short or mostly vertical movement does not change photo.
    await swipe(200, 180)
    await expect(counter(page)).toHaveText('1 / 6')
    await context.close()
  })

  test('has no horizontal scroll on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    for (const path of ['/gallery', album, '/news']) {
      await page.goto(path)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0)
    }
  })

  test('unknown albums are 404', async ({ page }) => {
    expect((await page.goto('/gallery/not-an-album'))?.status()).toBe(404)
  })
})
