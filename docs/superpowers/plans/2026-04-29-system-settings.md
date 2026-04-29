# System Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `system_settings` table (single row) with `registration_open`, `maintenance_mode`, and `invite_only` toggles — readable publicly, writable by admin — surfaced in the Admin UI and consumed by the client portal login page and app layout.

**Architecture:** Single-row DB table (CHECK id=1) with named boolean columns; a public `GET /api/settings` edge function route (no auth) + admin-only `PATCH /api/settings`; a `useSystemSettings` react-query hook in commons; a thin `ClientLoginPage` wrapper in client-portal that reads settings and passes derived props to `LoginPage`; maintenance banner in `AppLayout`.

**Tech Stack:** Supabase (Postgres + edge functions), Hono, Zod, React, @tanstack/react-query, Tailwind CSS

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `supabase/migrations/20260101000009_system_settings.sql` | Table DDL, single-row constraint, RLS |
| Create | `supabase/functions/api/routes/settings.ts` | GET (public) + PATCH (admin) |
| Modify | `supabase/functions/_shared/schemas.ts` | Add `SystemSettingsSchema` |
| Modify | `supabase/functions/api/index.ts` | Wire `/settings` route |
| Modify | `commons/types/project.types.ts` | Add `SystemSettings` type |
| Create | `commons/hooks/useSystemSettings.ts` | React-query hook, 1-min cache |
| Modify | `commons/hooks/index.ts` | Export `useSystemSettings` |
| Modify | `commons/components/LoginPage.tsx` | Add `registrationStatus` prop |
| Modify | `admin-portal/src/pages/SystemPage.tsx` | Add Settings card with toggle buttons |
| Create | `client-portal/src/pages/ClientLoginPage.tsx` | Reads settings, renders LoginPage |
| Modify | `client-portal/src/App.tsx` | Use `ClientLoginPage` on /login route |
| Modify | `client-portal/src/layouts/AppLayout.tsx` | Maintenance mode banner |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260101000009_system_settings.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260101000009_system_settings.sql
create table public.system_settings (
  id                integer primary key default 1 check (id = 1),
  registration_open boolean not null default true,
  maintenance_mode  boolean not null default false,
  invite_only       boolean not null default false,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users(id)
);

-- Seed the single row on creation
insert into public.system_settings (id) values (1);

-- Public read (login page needs registration_open without auth).
-- No client write — only service role via edge function.
alter table public.system_settings enable row level security;
create policy "system_settings: public read"
  on public.system_settings for select using (true);
```

- [ ] **Step 2: Apply the migration**

```bash
just db-reset
# or if you want incremental:
supabase db push
```

Expected: migration applies without error, `system_settings` table exists with 1 row.

- [ ] **Step 3: Verify**

```bash
just db-shell
# in psql:
select * from system_settings;
```

Expected: one row — `id=1, registration_open=true, maintenance_mode=false, invite_only=false`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260101000009_system_settings.sql
git commit -m "feat(db): add system_settings table with registration/maintenance toggles"
```

---

## Task 2: API Route — settings

**Files:**
- Create: `supabase/functions/api/routes/settings.ts`
- Modify: `supabase/functions/_shared/schemas.ts` (lines 1–end, append)
- Modify: `supabase/functions/api/index.ts`

- [ ] **Step 1: Add schema to `_shared/schemas.ts`**

Append to the end of `supabase/functions/_shared/schemas.ts`:

```ts
// System settings — single-row config table
export const SystemSettingsSchema = z.object({
  registration_open: z.boolean(),
  maintenance_mode:  z.boolean(),
  invite_only:       z.boolean(),
})

export const UpdateSystemSettingsSchema = SystemSettingsSchema.partial()
```

- [ ] **Step 2: Create `supabase/functions/api/routes/settings.ts`**

```ts
import { Hono } from 'npm:hono'
import { zValidator } from 'npm:@hono/zod-validator'
import { requireRole } from '../../_shared/auth.ts'
import { getAdminClient } from '../../_shared/db.ts'
import { UpdateSystemSettingsSchema } from '../../_shared/schemas.ts'

const settings = new Hono()

// GET /api/settings — public, no auth required
settings.get('/', async (c) => {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('system_settings')
    .select('registration_open, maintenance_mode, invite_only')
    .eq('id', 1)
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// PATCH /api/settings — admin only
settings.patch('/', zValidator('json', UpdateSystemSettingsSchema), async (c) => {
  await requireRole(c, 'admin')
  const admin = getAdminClient()
  const body = c.req.valid('json')
  const authHeader = c.req.header('Authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')

  // resolve user id for audit trail
  const { data: { user } } = await admin.auth.getUser(token)

  const { data, error } = await admin
    .from('system_settings')
    .update({ ...body, updated_at: new Date().toISOString(), updated_by: user?.id ?? null })
    .eq('id', 1)
    .select('registration_open, maintenance_mode, invite_only')
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export { settings }
```

- [ ] **Step 3: Wire the route in `supabase/functions/api/index.ts`**

```ts
import { Hono } from 'npm:hono'
import { users } from './routes/users.ts'
import { support } from './routes/support.ts'
import { usage } from './routes/usage.ts'
import { deployments } from './routes/deployments.ts'
import { magicLinks } from './routes/magic-links.ts'
import { llm } from './routes/llm.ts'
import { settings } from './routes/settings.ts'

const app = new Hono().basePath('/api')
  .route('/users', users)
  .route('/support', support)
  .route('/usage', usage)
  .route('/deployments', deployments)
  .route('/magic-links', magicLinks)
  .route('/llm', llm)
  .route('/settings', settings)

app.get('/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }))

export type AppType = typeof app

Deno.serve(app.fetch)
```

- [ ] **Step 4: Smoke-test the endpoints**

```bash
# Public GET (no token)
curl http://localhost:54321/functions/v1/api/settings
# Expected: {"registration_open":true,"maintenance_mode":false,"invite_only":false}

# PATCH without admin token should return 401/403
curl -X PATCH http://localhost:54321/functions/v1/api/settings \
  -H "Content-Type: application/json" \
  -d '{"maintenance_mode":true}'
# Expected: error response (unauthorized)
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/api/routes/settings.ts \
        supabase/functions/_shared/schemas.ts \
        supabase/functions/api/index.ts
git commit -m "feat(api): add GET/PATCH /api/settings for system_settings"
```

---

## Task 3: Commons — type + hook

**Files:**
- Modify: `commons/types/project.types.ts`
- Create: `commons/hooks/useSystemSettings.ts`
- Modify: `commons/hooks/index.ts`

- [ ] **Step 1: Add `SystemSettings` type to `commons/types/project.types.ts`**

Append to the end of the file:

```ts
export type SystemSettings = {
  registration_open: boolean
  maintenance_mode:  boolean
  invite_only:       boolean
}
```

- [ ] **Step 2: Create `commons/hooks/useSystemSettings.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '../api/fetchApi'
import { config } from '../config'
import type { SystemSettings } from '../types/project.types'

export function useSystemSettings() {
  return useQuery<SystemSettings>({
    queryKey: ['system-settings'],
    queryFn: () => fetchApi<SystemSettings>(`${config.apiUrl}/settings`),
    staleTime: 60_000,
  })
}
```

- [ ] **Step 3: Export from `commons/hooks/index.ts`**

Add this line:

```ts
export { useSystemSettings } from './useSystemSettings'
```

- [ ] **Step 4: Verify commons builds**

```bash
pnpm --filter commons exec tsc --noEmit
```

Expected: no new type errors from these additions.

- [ ] **Step 5: Commit**

```bash
git add commons/types/project.types.ts \
        commons/hooks/useSystemSettings.ts \
        commons/hooks/index.ts
git commit -m "feat(commons): add SystemSettings type and useSystemSettings hook"
```

---

## Task 4: LoginPage — registrationStatus prop

**Files:**
- Modify: `commons/components/LoginPage.tsx`

`registrationStatus` drives three states:
- `'open'` → show "Create account" link
- `'invite_only'` → show muted "Invite-only — contact us to get access" line
- `'closed'` or `undefined` → no registration UI

- [ ] **Step 1: Update `LoginPage` props and render**

Replace the `LoginPageProps` type and add the register UI in `commons/components/LoginPage.tsx`:

```tsx
type RegistrationStatus = 'open' | 'invite_only' | 'closed'

type LoginPageProps = {
  title?: string
  redirectTo?: string
  requiredRoles?: string[]
  showForgotPassword?: boolean
  devUsers?: DevUser[]
  registrationStatus?: RegistrationStatus
  registerHref?: string
}

export function LoginPage({
  title,
  redirectTo = '/',
  requiredRoles,
  showForgotPassword = false,
  devUsers,
  registrationStatus,
  registerHref = '/register',
}: LoginPageProps) {
```

Then inside the returned JSX, after the `<DevLogin>` line and before the closing `</form>`, add:

```tsx
      {registrationStatus === 'open' && (
        <p className="text-sm text-center text-[var(--color-text-muted)]">
          No account?{' '}
          <a href={registerHref} className="text-[var(--color-primary)] hover:underline font-medium">
            Create one
          </a>
        </p>
      )}

      {registrationStatus === 'invite_only' && (
        <p className="text-sm text-center text-[var(--color-text-muted)]">
          Registration is invite-only.
        </p>
      )}
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter commons exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add commons/components/LoginPage.tsx
git commit -m "feat(commons): add registrationStatus prop to LoginPage"
```

---

## Task 5: Admin UI — settings toggles

**Files:**
- Modify: `admin-portal/src/pages/SystemPage.tsx`

Add a "Settings" card above the deployment history card. Uses `useQuery` to read and `useMutation`-style optimistic update via `fetchApi`.

- [ ] **Step 1: Replace `SystemPage.tsx` content**

```tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApi, Button, useNotification, NotificationContainer, Card, CardHeader, CardBody, PageHeader, Input, useSystemSettings } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import type { Deployment, SystemSettings } from '@any-project-base/commons'

export function SystemPage() {
  const { notifications, notify, dismiss } = useNotification()
  const qc = useQueryClient()

  const { data: systemSettings, isLoading: settingsLoading } = useSystemSettings()

  const { data: deployments } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => fetchApi<{ data: Deployment[] }>(`${config.apiUrl}/deployments?limit=20&offset=0`),
  })

  const toggle = async (field: keyof SystemSettings) => {
    if (!systemSettings) return
    const updated = { [field]: !systemSettings[field] }
    try {
      await fetchApi(`${config.apiUrl}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(updated),
      })
      await qc.invalidateQueries({ queryKey: ['system-settings'] })
      notify({ type: 'success', message: 'Setting saved.' })
    } catch {
      notify({ type: 'error', message: 'Failed to save setting.' })
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="System" subtitle="Monitor deployments and system health" />

      <Card>
        <CardHeader>Settings</CardHeader>
        <CardBody>
          {settingsLoading ? (
            <p className="text-sm text-[var(--color-text-muted)] px-2">Loading…</p>
          ) : (
            <div className="space-y-4">
              <ToggleRow
                label="Registration open"
                description="Allow new users to create accounts"
                value={systemSettings?.registration_open ?? true}
                onToggle={() => { void toggle('registration_open') }}
              />
              <ToggleRow
                label="Invite only"
                description="Show invite-only message on login page instead of register link"
                value={systemSettings?.invite_only ?? false}
                onToggle={() => { void toggle('invite_only') }}
              />
              <ToggleRow
                label="Maintenance mode"
                description="Show maintenance banner on client portal"
                value={systemSettings?.maintenance_mode ?? false}
                onToggle={() => { void toggle('maintenance_mode') }}
              />
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader actions={<TestPushButton onNotify={notify} />}>Deployment history</CardHeader>
        <CardBody>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">SHA</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Env</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Deployed</th>
              </tr>
            </thead>
            <tbody>
              {(deployments?.data ?? []).map(d => (
                <tr key={d.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="px-6 py-3 text-sm text-[var(--color-text)] font-mono text-xs">{d.sha}</td>
                  <td className="px-6 py-3 text-sm text-[var(--color-text)]">{d.branch}</td>
                  <td className="px-6 py-3 text-sm text-[var(--color-text)]">{d.env}</td>
                  <td className="px-6 py-3 text-sm text-[var(--color-text)]">{new Date(d.deployed_at).toLocaleString()}</td>
                </tr>
              ))}
              {!deployments?.data?.length && (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-[var(--color-text-muted)]">No deployments yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}

function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string
  description: string
  value: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2
          ${value ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
            transform transition-transform duration-200
            ${value ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

function TestPushButton({ onNotify }: { onNotify: (n: { type: 'success' | 'error'; message: string }) => void }) {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')

  const send = async () => {
    if (!userId) return
    setLoading(true)
    try {
      await fetchApi(`${config.apiUrl}/push/test`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, title: 'Test push', body: 'Push notifications working!' }),
      })
      onNotify({ type: 'success', message: 'Test push sent.' })
    } catch {
      onNotify({ type: 'error', message: 'Push failed — check FCM config.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <Input value={userId} onChange={e => { setUserId(e.target.value) }}
        placeholder="User ID"
        className="w-48" />
      <Button size="sm" variant="secondary" loading={loading} onClick={() => { void send() }}>
        Test push
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Also export `useSystemSettings` and `SystemSettings` from commons index**

In `commons/index.ts`, verify these are exported (they should be via `./hooks/index` and `./types/project.types`). If not, add explicit exports.

- [ ] **Step 3: Type-check admin portal**

```bash
pnpm --filter admin-portal exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add admin-portal/src/pages/SystemPage.tsx
git commit -m "feat(admin): add system settings toggles to SystemPage"
```

---

## Task 6: Client portal — login page wiring

**Files:**
- Create: `client-portal/src/pages/ClientLoginPage.tsx`
- Modify: `client-portal/src/App.tsx`

- [ ] **Step 1: Create `client-portal/src/pages/ClientLoginPage.tsx`**

```tsx
import { LoginPage, useSystemSettings, CLIENT_DEV_USERS } from '@any-project-base/commons'
import type { SystemSettings } from '@any-project-base/commons'

function deriveRegistrationStatus(settings: SystemSettings | undefined) {
  if (!settings) return undefined
  if (settings.invite_only) return 'invite_only' as const
  if (settings.registration_open) return 'open' as const
  return 'closed' as const
}

export function ClientLoginPage() {
  const { data: settings } = useSystemSettings()
  return (
    <LoginPage
      redirectTo="/"
      showForgotPassword
      devUsers={CLIENT_DEV_USERS}
      registrationStatus={deriveRegistrationStatus(settings)}
    />
  )
}
```

- [ ] **Step 2: Update `client-portal/src/App.tsx`** — swap `LoginPage` import for `ClientLoginPage`

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthLayoutRoute, CookieBanner, CommitWatermark } from '@any-project-base/commons'
import { AppLayout } from './layouts/AppLayout'
import { ClientLoginPage } from './pages/ClientLoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/settings/ProfilePage'
import { BillingPage } from './pages/settings/BillingPage'
import { SupportPage } from './pages/SupportPage'
import { BuyCreditsPage } from './pages/BuyCreditsPage'
import { BuyCreditsSuccess } from './pages/BuyCreditsSuccess'
import { BuyCreditsCancel } from './pages/BuyCreditsCancel'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayoutRoute />}>
          <Route path="/login" element={<ClientLoginPage />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route path="/settings/billing" element={<BillingPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/buy-credits" element={<BuyCreditsPage />} />
          <Route path="/buy-credits/success" element={<BuyCreditsSuccess />} />
          <Route path="/buy-credits/cancel"  element={<BuyCreditsCancel />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieBanner />
      <CommitWatermark />
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Type-check client portal**

```bash
pnpm --filter client-portal exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add client-portal/src/pages/ClientLoginPage.tsx \
        client-portal/src/App.tsx
git commit -m "feat(client): wire system settings into login page (registrationStatus)"
```

---

## Task 7: Client portal — maintenance banner

**Files:**
- Modify: `client-portal/src/layouts/AppLayout.tsx`

Add a yellow banner at the top of the authenticated layout when `maintenance_mode = true`.

- [ ] **Step 1: Update `AppLayout.tsx`**

Add `useSystemSettings` import and insert the banner just inside the `<PageLayout>` render:

```tsx
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router'
import { useAuth, useCredits, useSystemSettings, Sidebar, PageLayout } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import { LayoutDashboard, MessageSquare, CreditCard, Settings, Zap } from 'lucide-react'
import { supabase } from '@any-project-base/commons/lib/supabase'

const BASE_NAV = [
  { label: 'Dashboard', href: '/',        icon: LayoutDashboard },
  { label: 'Support',   href: '/support', icon: MessageSquare },
]

const BILLING_ITEM  = { label: 'Billing',      href: '/settings/billing',  icon: CreditCard }
const SETTINGS_ITEM = { label: 'Settings',     href: '/settings/profile',  icon: Settings }

function CreditsWidget({ onBuy }: { onBuy: () => void }) {
  const { balance } = useCredits()
  return (
    <div className="rounded-xl bg-[var(--color-primary)]/8 px-4 py-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-[var(--color-primary)]" />
        <span className="text-sm font-semibold text-[var(--color-primary)]">
          {balance.toLocaleString()}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">credits</span>
      </div>
      <button
        onClick={onBuy}
        className="text-xs font-medium text-[var(--color-primary)] hover:underline"
      >
        Buy →
      </button>
    </div>
  )
}

export function AppLayout() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: systemSettings } = useSystemSettings()

  if (loading) return (
    <div
      className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]"
      style={{ background: 'linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 60%, #E0F2FE 100%)' }}
    >
      Loading…
    </div>
  )
  if (!user) return <Navigate to="/login" replace />

  const navItems = [
    ...BASE_NAV,
    ...(config.pricingModel !== 'none' ? [BILLING_ITEM] : []),
    SETTINGS_ITEM,
  ]

  const handleLogout = async () => { await supabase.auth.signOut() }

  return (
    <PageLayout
      variant="client"
      sidebar={
        <Sidebar
          navItems={navItems}
          currentPath={location.pathname}
          onNavigate={(href) => { void navigate(href) }}
          projectName={config.projectName}
          user={user}
          role={role}
          onLogout={() => { void handleLogout() }}
          creditsDisplay={
            <CreditsWidget onBuy={() => { void navigate('/buy-credits') }} />
          }
        />
      }
    >
      {systemSettings?.maintenance_mode && (
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm text-center py-2 px-4">
          System maintenance in progress — some features may be temporarily unavailable.
        </div>
      )}
      <Outlet />
    </PageLayout>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter client-portal exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client-portal/src/layouts/AppLayout.tsx
git commit -m "feat(client): show maintenance banner from system_settings"
```

---

## Task 8: Manual end-to-end verification

- [ ] **Step 1: Start the stack**

```bash
just start
```

- [ ] **Step 2: Verify login page — registration open (default)**

Browse to `http://localhost:6173/login`.
Expected: "Create one" link visible below the dev login section.

- [ ] **Step 3: Toggle registration off via admin**

Browse to `http://localhost:6174/system`.
Toggle "Registration open" to OFF.
Browse back to `http://localhost:6173/login`.
Expected: "Create one" link gone.

- [ ] **Step 4: Toggle invite_only on**

In admin System page, toggle "Invite only" to ON.
Refresh `http://localhost:6173/login`.
Expected: "Registration is invite-only." text visible.

- [ ] **Step 5: Toggle maintenance mode on**

In admin System page, toggle "Maintenance mode" to ON.
Log in to client portal and navigate to dashboard.
Expected: yellow maintenance banner at top of the page.

- [ ] **Step 6: Restore defaults**

Toggle all settings back to defaults (registration open, invite_only off, maintenance off).

---

## Assessment

| Dimension | Value |
|-----------|-------|
| Architectural change | No — additive only, no existing behaviour altered |
| Complexity | 4/10 |
| Certainty | High — pattern follows existing routes/hooks exactly |
| Impact | Medium — touches commons LoginPage, client AppLayout, admin SystemPage |
