import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

const MOCK_PAYMENT = 'http://localhost:5242'

test.describe('Buy credits — mock payment flow', () => {
  test('redirects to mock payment page on buy', async ({ page }) => {
    await loginAs(page, 'user@dev.local')
    await page.goto('/buy-credits')
    await expect(page.getByRole('heading', { name: /buy credits/i })).toBeVisible()

    // Click the first preset pack
    await page.getByRole('button', { name: /^Buy$/i }).first().click()

    // Should redirect to mock payment server
    await page.waitForURL(`${MOCK_PAYMENT}/c/**`, { timeout: 10000 })
    await expect(page.getByText(/payment provider mock/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /approve/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /deny/i })).toBeVisible()
  })

  test('approve adds credits and redirects to success page', async ({ page }) => {
    await loginAs(page, 'user@dev.local')
    await page.goto('/buy-credits')

    // Click first pack (100 credits)
    await page.getByRole('button', { name: /^Buy$/i }).first().click()
    await page.waitForURL(`${MOCK_PAYMENT}/c/**`, { timeout: 10000 })

    // Get session ID from URL
    const sessionUrl = page.url()
    expect(sessionUrl).toContain('/c/')

    // Approve payment
    await page.getByRole('button', { name: /approve/i }).click()

    // Should redirect to success page on the client portal
    await page.waitForURL('**/buy-credits/success**', { timeout: 10000 })
    await expect(page.getByText(/purchase successful/i)).toBeVisible()
    await expect(page.getByText(/100/)).toBeVisible()
  })

  test('deny redirects to cancel page', async ({ page }) => {
    await loginAs(page, 'user@dev.local')
    await page.goto('/buy-credits')

    await page.getByRole('button', { name: /^Buy$/i }).first().click()
    await page.waitForURL(`${MOCK_PAYMENT}/c/**`, { timeout: 10000 })

    await page.getByRole('button', { name: /deny/i }).click()

    await page.waitForURL('**/buy-credits/cancel**', { timeout: 10000 })
    await expect(page.getByText(/purchase cancelled/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible()
  })

  test('mock payment server is not available — shows error message', async ({ page }) => {
    await loginAs(page, 'user@dev.local')
    await page.goto('/buy-credits')

    // Intercept the checkout API call to simulate mock server being down
    await page.route('**/users/me/credits/checkout', route =>
      route.fulfill({ status: 503, body: JSON.stringify({ error: 'Mock payment server not running' }) }),
    )

    await page.getByRole('button', { name: /^Buy$/i }).first().click()

    // Should show error notification
    await expect(page.getByText(/not running/i)).toBeVisible({ timeout: 5000 })
  })

  test('custom credit amount checkout', async ({ page }) => {
    await loginAs(page, 'user@dev.local')
    await page.goto('/buy-credits')

    await page.locator('input[type="number"]').fill('250')
    await page.getByRole('button', { name: /Buy 250/i }).click()

    await page.waitForURL(`${MOCK_PAYMENT}/c/**`, { timeout: 10000 })
    await expect(page.getByText('250')).toBeVisible()
  })
})

test.describe('Buy credits UI', () => {
  test('shows credit pack prices from constants', async ({ page }) => {
    await loginAs(page, 'user@dev.local')
    await page.goto('/buy-credits')

    await expect(page.getByText('100 credits')).toBeVisible()
    await expect(page.getByText('$5')).toBeVisible()
    await expect(page.getByText('500 credits')).toBeVisible()
    await expect(page.getByText('$20')).toBeVisible()
  })
})
