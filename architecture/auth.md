# Auth Architecture

## Providers

Selected during `just setup` auth step. Written to `project.yaml: auth_providers`.

### Setup step UX

```
Can users self-register? (y/n): _

Select auth providers: (↑↓ move, space select, a=all, n=none)

  ● email/password       ← always available
  ○ google
  ○ facebook
  ○ apple
  ○ github
  ○ discord
  ○ twitter/x
  ○ spotify
  ○ linkedin
  ○ azure
  ○ notion
  ○ zoom
  ○ twitch

Need help setting these up? (y/n): _
```

If yes: prints per-provider instructions (where to create OAuth app,
what to copy, where to paste in Supabase dashboard).
Also prints: "OAuth providers do not work on local dev — use dev login instead."

### Email always on in dev

Regardless of `auth_providers` config, `email/password` auth is always
enabled in local + test envs. Controlled by `APP_ENV`.

## Identity Linking

Auto-link enabled in Supabase Auth settings:
- Same verified email across providers → same `auth.users` row
- `auth.identities` tracks each method separately
- No custom `auth_methods` table needed — Supabase manages this

## Dev Login

Available in `APP_ENV !== 'prod'`. Guarded in two places:
1. `dev-login` edge function returns 403 if `APP_ENV === 'prod'`
2. Frontend component only renders if `VITE_APP_ENV !== 'prod'`

Both guards must pass. Belt + suspenders.

### Flow

Admin generates magic link for seed user via service role:
```typescript
// functions/dev-login/index.ts
if (Deno.env.get('APP_ENV') === 'prod') return c.json({ error: 'Forbidden' }, 403)

const { data } = await adminClient.auth.admin.generateLink({
  type: 'magiclink',
  email: req.email
})
return c.json({ url: data.properties.action_link })
```

Frontend redirects to link → user authenticated instantly.

### Dev login UI

Replaces login form when `VITE_APP_ENV !== 'prod'`:

```
┌─────────────────────────────────┐
│  DEV LOGIN                      │
│  local/test environment only    │
├─────────────────────────────────┤
│  [▶ Login as Admin    ]         │
│  [▶ Login as Support  ]         │
│  [▶ Login as User     ]         │
│  [▶ Login as User (no credits)] │
└─────────────────────────────────┘
```

### Test users philosophy

> In every non-prod environment, a maintained set of test users must always
> be available. One per role minimum. Additional users for specific states
> (e.g. user with credits, user with active subscription, user with no devices).
> These are first-class citizens — kept in sync with schema in `seed.sql`.
> Never mutate base role users during testing. Add new seed users for new states.

Seed users defined in `supabase/seed.sql`:

| Email | Role | State |
|-------|------|-------|
| admin@dev.local | admin | — |
| support@dev.local | support | — |
| user@dev.local | user | has credits |
| user-nocredits@dev.local | user | zero credits |
| user-sub@dev.local | user | active subscription |

## Client Magic Links (Production Feature)

Admin generates one-click login link for a specific client. Client clicks → authenticated.
Works on web + mobile (deep link via app intent).

**Use case:** client-only apps where admin manages accounts directly.

### Flow

1. Admin visits user detail page → clicks "Generate login link"
2. Edge function calls `supabase.auth.admin.generateLink({ type: 'magiclink', email })`
3. Saves hash of token to `magic_links` table
4. Returns full URL to admin → copied to clipboard
5. Admin sends link to client (email, message, etc — outside app)
6. Client clicks → Supabase authenticates → `clicked_at` updated in `magic_links`
7. Link dead after first click (Supabase single-use by default)

### Admin UI — user detail page

**Login Links section:**

| Generated | Clicked | Status |
|-----------|---------|--------|
| 2026-04-16 14:32 | 2026-04-16 14:45 | ✓ used |
| 2026-04-16 10:11 | — | ✗ expired |

`[Generate new link]` button — copies to clipboard immediately.

No admin notification when client clicks. Link status visible on refresh.

**Devices section:**

| Platform | Last seen | First seen |
|----------|-----------|------------|
| android | 2026-04-16 14:45 | 2026-03-01 09:00 |
| web | 2026-04-15 09:02 | 2026-04-10 11:23 |

`last_seen` updated on every authenticated API request via auth middleware.

## Session

Cookie-based via Supabase built-in. No custom session management.

```typescript
// commons/lib/supabase.ts
export const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
// Supabase handles: cookie storage, refresh, expiry
```

## Role Enforcement

Roles live in `public.users.role`. Checked in edge functions — never in frontend only.

```typescript
// _shared/auth.ts
export async function requireRole(c: Context, ...roles: string[]) {
  const user = await requireAuth(c)
  const { data } = await adminClient
    .from('users').select('role').eq('id', user.id).single()
  if (!roles.includes(data?.role))
    return c.json({ error: 'Forbidden' }, 403)
  return { ...user, role: data.role }
}

// usage
app.get('/admin/users', async (c) => {
  await requireRole(c, 'admin', 'support')
  // ...
})
```

Frontend role check = UI only (hide buttons). Backend role check = always enforced.

## Checker

`setup/checks/auth_check.sh`:
- `auth_providers` in project.yaml all have corresponding env vars set
- `dev-login` function has `APP_ENV` guard present (grep check)
- Frontend dev login component has `VITE_APP_ENV` guard (grep check)
- All seed users present in seed.sql
- `magic_links` table exists in migrations
- `devices.last_seen` column exists
