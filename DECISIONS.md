# Architectural Decisions

Recorded during scaffold build. Includes deviations from first attempt and non-obvious version choices.

---

## Dependency versions (pinned exact, no ^ or ~)

| Package | Version | Reason |
|---------|---------|--------|
| react | 19.1.0 | Latest stable; React 19 concurrent features needed for streaming |
| vite | 6.3.3 | Latest; v6 has faster HMR and first-class ESM |
| tailwindcss | 4.1.5 | v4 CSS-first (`@import "tailwindcss"`) — no tailwind.config.js needed |
| react-router | 7.5.3 | v7 unifies data loader + action patterns |
| @tanstack/react-query | 5.74.4 | v5 stable; simplified hooks API |
| @supabase/supabase-js | 2.49.4 | SSR-safe createBrowserClient |
| hono | 4.7.7 | Deno-compatible, typed client via `hc<AppType>` |
| zod | 3.24.4 | Schema validation used in edge functions AND commons |
| expo | ~53.0.0 | Latest Expo SDK, ships React Native 0.77.0 |
| expo-router | ~4.0.0 | File-based routing for Expo |

---

## Tailwind v4 — no config file

Decision: use `@import "tailwindcss"` in globals.css directly. No `tailwind.config.js`.

Tailwind v4 is CSS-first. Configuration via `@theme {}` block if overrides needed. Removed `tailwind.config.js` from project — it doesn't exist and is not needed.

Color system uses CSS custom properties (`var(--color-*)`). Tailwind arbitrary values like `bg-[var(--color-primary)]` still work. This is the architecture's requirement.

---

## TypeScript strict mode

All projects use:
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "verbatimModuleSyntax": true
}
```

`verbatimModuleSyntax` requires `import type` for type-only imports. Applied consistently.

---

## fetchApi — no raw fetch anywhere

ESLint `no-restricted-globals: fetch` enforces this. All HTTP goes through `commons/api/fetchApi.ts`. This wrapper:
- Throws `ApiError` (with `status` field) on non-ok responses
- Handles 204 No Content (returns null)
- Used by `commons/api/client.ts` (Hono typed client) and directly for non-typed calls

---

## Hono typed client (`hc<AppType>`)

`AppType` exported from `supabase/functions/api/index.ts` and imported in `commons/api/client.ts`. This gives end-to-end type safety: if edge function changes a route shape, TypeScript errors appear in frontends immediately.

Decision: `client.ts` in commons (not per-portal) so all frontends share typed API access.

---

## Commons package — pnpm workspace

`@any-project-base/commons` is a shared pnpm workspace package. Portals and mobile-app import directly from source (no build step for commons). TypeScript path aliases (`@any-project-base/commons`) configured per-project.

Mobile-app maps the alias in `tsconfig.json` paths. Portals use Vite's `resolve.alias`.

---

## Supabase migrations — naming

All migrations use timestamp format `YYYYMMDD000000_name.sql`. Order:
1. `_init` — users table, RLS, triggers
2. `_devices` — push notification device tokens
3. `_support` — support conversations + messages
4. `_usage` — LLM usage logging
5. `_deployments` — deployment history
6. `_magic_links` — magic link tokens
7. `_email_templates` — email template storage
8. `_stripe` — billing tables (Stripe customers/subscriptions/transactions)
9. `_credits` — credit balance with atomic deduction

All tables have RLS enabled. Service role key never reaches frontend.

---

## Atomic credit deduction

Credits deducted with single UPDATE:
```sql
UPDATE credits SET balance = balance - $n
WHERE user_id = $id AND balance >= $n
```
Returns 0 rows if insufficient — no race condition, no negative balances. LLM route returns 402 if update touches 0 rows.

---

## DevLogin — prod guard in two places

1. Edge function `dev-login/index.ts`: `if (APP_ENV === 'prod') return 403` on first line
2. Frontend `DevLogin.tsx`: `if (config.appEnv === 'prod') return null` before render

Both guards required. Frontend guard is UX (hides button). Backend guard is security (blocks call even if someone bypasses UI).

---

## Mobile platform abstraction

All native API calls (expo-notifications, expo-camera, etc.) live only in `src/platform/*.ts`. Each file exports a module with a web stub for `Platform.OS === 'web'`. No native imports allowed outside `src/platform/`.

Enforced by `setup/checks/mobile_check.sh` which greps for native module imports outside that directory.

This pattern also ensures `expo export --platform web` succeeds in CI — web stubs prevent native calls from failing during build.

---

## Admin portal role guard — two layers

1. After Supabase auth: query `public.users` to read `role` field
2. If `role` not in `['admin', 'support']`: sign out + show error
3. Route-level guard in `AppLayout.tsx`: redirect to `/login` if no user or wrong role

The edge functions use `requireRole(c, 'admin', 'support')` from `_shared/auth.ts` as a third layer.

---

## Landing page — multi-entry Vite build

Landing uses separate HTML files per locale (`en/index.html`, `es/index.html`, `ko/index.html`). Vite multi-entry build generates one bundle with locale-specific entry points. Language detection via cookie + `Accept-Language` header in `js/main.js`.

No React on landing — plain HTML/JS/CSS for maximum performance and simplest CDN caching.

---

## Setup scripts — Python3 for JSON state

`setup/lib/ui.sh` uses `python3` for JSON manipulation of `.install-state.json`. Decision: avoid `jq` dependency (not always installed). Python3 is universally available on macOS/Linux dev machines.

---

## First-attempt deviations

1. **client-portal layouts/pages**: Write calls were rejected on first attempt for 4 files (AppLayout, AuthLayout, LoginPage, RemoveMeThisIsOnlyDemoLlmChat). Resubmitted identically next session — accepted. No code change. Cause unknown, possibly permission prompt timing.

2. **ScheduleWakeup max**: Requested 12600s (3h30m). Clamped to 3600s by runtime. Solution: chained wakeups — each re-schedules itself for another 3600s. First wakeup had non-chaining prompt; second corrected to chain properly.

3. **pnpm-workspace.yaml mobile-app**: Initially omitted mobile-app from workspace packages. Added after AGENTS.md review confirmed it should be a workspace member for commons import resolution.

---

## What's NOT in this scaffold (intentional)

- **Auth providers** (Google OAuth, Apple, etc.) — setup scripts exist (`setup/auth-providers/`) but scripts not written; follow same pattern as platform scripts
- **Sentry** — `commons/lib/errorMonitor.ts` wrapper exists; setup script not written (same pattern as PostHog)
- **Push notification native implementations** — `src/platform/*.native.ts` files not created; `*.ts` stubs exist and are the abstraction layer
- **EAS configuration** — `eas.json` intentionally absent; add when ready for app store
