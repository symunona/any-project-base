import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Profile update', () => {
  test('saves name and notification settings', async ({ page }) => {
    await loginAs(page, 'user@dev.local')

    await page.goto('/settings/profile')
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible()

    // Update name
    const nameInput = page.locator('input[type="text"]').first()
    await nameInput.clear()
    await nameInput.fill('Updated Test Name')

    // Toggle a notification setting off
    const creditDepletionCheckbox = page.locator('input[type="checkbox"]').nth(1)
    const wasChecked = await creditDepletionCheckbox.isChecked()
    await creditDepletionCheckbox.click()

    // Save
    await page.getByRole('button', { name: /save/i }).click()

    // Should see success notification
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 })

    // Reload and verify name persisted
    await page.reload()
    await page.waitForLoadState('networkidle')
    const nameValue = await nameInput.inputValue()
    expect(nameValue).toBe('Updated Test Name')

    // Verify notification setting persisted
    const state = await creditDepletionCheckbox.isChecked()
    expect(state).toBe(!wasChecked)
  })

  test('shows error toast if API fails', async ({ page }) => {
    await loginAs(page, 'user@dev.local')
    await page.goto('/settings/profile')

    // Force an error by intercepting the PATCH request
    await page.route('**/users/me/settings', route => route.fulfill({ status: 500, body: '{"error":"test error"}' }))

    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText(/something went wrong/i)).toBeVisible({ timeout: 5000 })
  })
})
