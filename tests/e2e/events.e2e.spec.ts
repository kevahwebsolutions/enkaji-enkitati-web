import { expect, test, type APIRequestContext } from '@playwright/test'

const base = 'http://localhost:3000'
const adminEmail = process.env.SEED_ADMIN_EMAIL
const adminPassword = process.env.SEED_ADMIN_PASSWORD

/** Signs in to the admin API so a test can create and remove its own events. */
async function admin(request: APIRequestContext) {
  const response = await request.post(`${base}/api/users/login`, {
    data: { email: adminEmail, password: adminPassword },
  })
  const { token } = (await response.json()) as { token: string }
  const headers = { Authorization: `JWT ${token}` }
  return {
    async createEvent(data: Record<string, unknown>): Promise<number> {
      const created = await request.post(`${base}/api/events`, {
        headers,
        data: { venue: 'E2E venue', status: 'upcoming', _status: 'published', ...data },
      })
      const body = (await created.json()) as { doc?: { id: number }; errors?: unknown }
      expect(body.doc?.id, JSON.stringify(body.errors)).toBeTruthy()
      return body.doc!.id
    },
    async deleteEvent(id: number): Promise<void> {
      // Remove the RSVPs too, so they never count toward the per-connection rate limit.
      const list = await request.get(
        `${base}/api/form-submissions?where[formType][equals]=rsvp&limit=200`,
        { headers },
      )
      const { docs } = (await list.json()) as {
        docs: Array<{ id: number; data: { eventId?: number } }>
      }
      for (const doc of docs.filter((d) => d.data?.eventId === id)) {
        await request.delete(`${base}/api/form-submissions/${doc.id}`, { headers })
      }
      await request.delete(`${base}/api/events/${id}`, { headers })
    },
  }
}

const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString()

test.describe('Events list', () => {
  test('shows upcoming events by default with the tabs, view toggle and program filter', async ({
    page,
  }) => {
    await page.goto('/events')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('link', { name: /^Upcoming/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(page.getByRole('link', { name: /^Past/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Calendar' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Filter by program' })).toBeVisible()
    await expect(page.locator('main article')).not.toHaveCount(0)
  })

  test('the Past tab lists events that have finished', async ({ page }) => {
    await page.goto('/events?tab=past')
    await expect(page.getByRole('link', { name: /^Past/ })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByText('Day of the African Child celebration')).toBeVisible()
    await expect(page.getByText('International Day of Rural Women')).toHaveCount(0)
  })

  test('filters by program through the URL', async ({ page }) => {
    await page.goto('/events?tab=past&program=education-and-mentorship')
    await expect(page.getByText('Ignite Dreams primary school mentorship visit')).toBeVisible()
    await expect(page.getByText('Beadwork and business skills workshop')).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: 'Education and Mentorship' }).first(),
    ).toHaveAttribute('aria-current', 'page')
  })

  test('the calendar view shows the month grid and moves between months', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/events?view=calendar&month=2026-10')
    await expect(page.getByRole('heading', { name: 'October 2026' })).toBeVisible()
    await expect(
      page.locator('table').getByRole('link', { name: 'International Day of Rural Women' }),
    ).toBeVisible()
    await page.getByRole('link', { name: /Next/ }).first().click()
    await expect(page.getByRole('heading', { name: 'November 2026' })).toBeVisible()
    await expect(
      page
        .locator('table')
        .getByRole('link', { name: /16 Days of Activism/ })
        .first(),
    ).toBeVisible()
  })

  test('the calendar becomes a day-by-day agenda on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/events?view=calendar&month=2026-10')
    await expect(page.locator('table')).toBeHidden()
    await expect(
      page.getByRole('link', { name: 'International Day of Rural Women' }).first(),
    ).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    expect(overflow).toBe(0)
  })

  test('past events are paginated nine to a page', async ({ page, request }) => {
    test.skip(!adminEmail, 'needs the seed admin credentials')
    const api = await admin(request)
    const run = Date.now()
    const ids: number[] = []
    try {
      for (let n = 0; n < 4; n++) {
        ids.push(
          await api.createEvent({
            title: `Pagination filler ${run} ${n}`,
            slug: `pagination-filler-${run}-${n}`,
            startsAt: iso(-(48 + n) * 3600_000),
            endsAt: iso(-(47 + n) * 3600_000),
          }),
        )
      }
      await page.goto('/events?tab=past')
      await expect(page.locator('main article')).toHaveCount(9)
      const nav = page.getByRole('navigation', { name: 'Past events pages' })
      await expect(nav).toBeVisible()
      await nav.getByRole('link', { name: 'Page 2' }).click()
      await expect(page).toHaveURL(/page=2/)
      await expect(page.locator('main article').first()).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Page 2' })).toHaveAttribute(
        'aria-current',
        'page',
      )
    } finally {
      for (const id of ids) await api.deleteEvent(id)
    }
  })

  test('an event moves from Upcoming to Past by itself once its end time passes', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000)
    test.skip(!adminEmail, 'needs the seed admin credentials')
    const api = await admin(request)
    const run = Date.now()
    const title = `Auto-move test ${run}`
    const id = await api.createEvent({
      title,
      slug: `auto-move-${run}`,
      startsAt: iso(-3600_000),
      endsAt: iso(25_000),
    })
    try {
      await page.goto('/events')
      await expect(page.getByRole('link', { name: title })).toBeVisible()
      await page.goto('/events?tab=past')
      await expect(page.getByRole('link', { name: title })).toHaveCount(0)

      await page.waitForTimeout(30_000)

      await page.goto('/events')
      await expect(page.getByRole('link', { name: title })).toHaveCount(0)
      await page.goto('/events?tab=past')
      await expect(page.getByRole('link', { name: title })).toBeVisible()
    } finally {
      await api.deleteEvent(id)
    }
  })
})

test.describe('Event page', () => {
  const slug = 'rural-women-day-2026'

  test('shows Nairobi time, venue, sponsor tiers and add-to-calendar options', async ({ page }) => {
    await page.goto(`/events/${slug}`)
    await expect(page.locator('h1')).toHaveText('International Day of Rural Women')
    await expect(page.getByText('15 October 2026').first()).toBeVisible()
    await expect(page.getByText('9:00 am to 3:00 pm')).toBeVisible()
    await expect(page.getByText('East Africa Time')).toBeVisible()
    await expect(page.getByText(/Ewaso Ng.iro, Narok/).first()).toBeVisible()
    for (const tier of ['Platinum', 'Gold', 'Silver', 'Bronze']) {
      await expect(page.getByRole('heading', { name: tier })).toBeVisible()
    }
    await expect(page.getByText('KES 200,000+')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Download .ics' })).toHaveAttribute(
      'href',
      `/events/${slug}/calendar.ics`,
    )
    const google = await page.getByRole('link', { name: /Google Calendar/ }).getAttribute('href')
    const url = new URL(google ?? '')
    expect(url.hostname).toBe('calendar.google.com')
    expect(url.searchParams.get('dates')).toBe('20261015T060000Z/20261015T120000Z')
  })

  test('includes Event structured data', async ({ page }) => {
    await page.goto(`/events/${slug}`)
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
    const data = JSON.parse(raw ?? '{}') as Record<string, unknown>
    expect(data['@type']).toBe('Event')
    expect(data.name).toBe('International Day of Rural Women')
    expect(data.startDate).toBe('2026-10-15T09:00:00+03:00')
    expect(data.eventStatus).toBe('https://schema.org/EventScheduled')
  })

  test('serves a calendar file that downloads as an attachment', async ({ request }) => {
    const response = await request.get(`${base}/events/${slug}/calendar.ics`)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/calendar')
    expect(response.headers()['content-disposition']).toContain(`${slug}.ics`)
    const body = await response.text()
    expect(body).toContain('BEGIN:VEVENT')
    expect(body).toContain('DTSTART:20261015T060000Z')
    expect(body).toContain('DTEND:20261015T120000Z')
    expect(body).toContain('SUMMARY:International Day of Rural Women')
  })

  test('unknown events and their calendar files are 404', async ({ page, request }) => {
    expect((await page.goto('/events/not-an-event'))?.status()).toBe(404)
    expect((await request.get(`${base}/events/not-an-event/calendar.ics`)).status()).toBe(404)
  })

  test('a past event shows a recap and no registration or sponsor tiers', async ({ page }) => {
    await page.goto('/events/day-of-the-african-child-2026')
    await expect(page.getByText('Past event')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Photos from the day' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Register to attend' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Sponsor this event' })).toHaveCount(0)
  })
})

test.describe('RSVP', () => {
  test('validates, enforces capacity and closes when full', async ({ page, request }) => {
    test.setTimeout(120_000)
    test.skip(!adminEmail, 'needs the seed admin credentials')
    const api = await admin(request)
    const run = Date.now()
    const slug = `rsvp-e2e-${run}`
    const id = await api.createEvent({
      title: `RSVP e2e ${run}`,
      slug,
      startsAt: iso(2 * 24 * 3600_000),
      endsAt: iso(2 * 24 * 3600_000 + 3 * 3600_000),
      rsvpEnabled: true,
      capacity: 3,
    })

    const fill = async (name: string, attendees: string, extra: Record<string, string> = {}) => {
      await page.locator('main').getByLabel('Full name').fill(name)
      await page
        .locator('main')
        .getByLabel('Email address')
        .fill(extra.email ?? '')
      await page
        .locator('main')
        .getByLabel('Phone number')
        .fill(extra.phone ?? '')
      await page.locator('main').getByLabel('Number of people').fill(attendees)
      if (extra.consent !== 'no') await page.locator('main').getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Register' }).click()
    }

    try {
      await page.goto(`/events/${slug}`)
      await expect(page.getByText('3 places are left').first()).toBeVisible()

      // Required fields and formats are checked on the server.
      await page.getByRole('button', { name: 'Register' }).click()
      await expect(page.getByText('Enter your name.')).toBeVisible()
      await expect(page.getByText('Give an email address or a phone number.')).toBeVisible()
      await expect(page.getByText('Please agree so we can keep your details.')).toBeVisible()

      await page.goto(`/events/${slug}`)
      await fill('Test Guest', '1', { phone: '12345' })
      await expect(
        page.getByText('Enter a Kenyan mobile number such as 0712 345 678.'),
      ).toBeVisible()

      // Two places are taken, leaving one.
      await page.goto(`/events/${slug}`)
      await fill('First Guest', '2', { email: `first-${run}@example.test` })
      await expect(page.getByText('You are registered', { exact: true })).toBeVisible()

      // A group of two no longer fits.
      await page.goto(`/events/${slug}`)
      await fill('Second Guest', '2', { phone: '0712 345 678' })
      await expect(
        page.getByText('Only 1 place is left. Please lower the number of people.'),
      ).toBeVisible()

      // One person takes the last place.
      await page.locator('main').getByLabel('Number of people').fill('1')
      await page.locator('main').getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Register' }).click()
      await expect(page.getByText('You are registered', { exact: true })).toBeVisible()

      // The page now reports the event as full and offers no form.
      await expect
        .poll(
          async () => {
            await page.goto(`/events/${slug}`)
            return page.getByText('Registration is full').count()
          },
          { timeout: 30_000 },
        )
        .toBeGreaterThan(0)
      await expect(page.getByRole('button', { name: 'Register' })).toHaveCount(0)
    } finally {
      await api.deleteEvent(id)
    }
  })
})
