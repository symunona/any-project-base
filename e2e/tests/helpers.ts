import { type Page } from '@playwright/test'

// DevLogin component buttons use signInWithPassword({ password: 'devpassword' })
// which is PKCE-compatible (magic link flow is not — @supabase/ssr forces PKCE).
const EMAIL_TO_LABEL: Record<string, string> = {
  'admin@dev.local':          'Admin',
  'support@dev.local':        'Support',
  'user@dev.local':           'User',
  'user-nocredits@dev.local': 'User (no credits)',
  'user-sub@dev.local':       'User (subscription)',
}

export async function loginAs(page: Page, email: string) {
  const label = EMAIL_TO_LABEL[email] ?? email
  await page.goto('/login')
  await Promise.all([
    page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 }),
    page.getByRole('button', { name: `▶ ${label}`, exact: true }).click(),
  ])
}

export async function getCreditsBalance(page: Page): Promise<number> {
  const text = await page.locator('[data-testid="credits-balance"], .credits-balance').first().textContent()
  return parseInt((text ?? '0').replace(/[^0-9]/g, ''), 10)
}
