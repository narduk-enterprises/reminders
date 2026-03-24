import { expect, test, waitForBaseUrlReady, waitForHydration, warmUpApp } from './fixtures'

test.describe('web smoke', () => {
  test.beforeAll(async ({ browser, baseURL }) => {
    if (!baseURL) {
      throw new Error('web smoke tests require Playwright baseURL to be configured.')
    }

    await waitForBaseUrlReady(baseURL)
    await warmUpApp(browser, baseURL)
  })

  test('home redirects to reminders', async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)
    await expect(page).toHaveURL(/\/reminders\/?$/)
    await expect(page.getByText('Stay organized and never miss a thing.')).toBeVisible()
  })
})
