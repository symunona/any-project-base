# setup/static/ — AGENTS.md

Read first:
1. `/AGENTS.md` (root)
2. `setup/AGENTS.md`
3. `architecture/setup-ux.md`

---

## Purpose

Setup + check scripts for static frontend hosting.
Hosts: `landing/`, `client-portal/`, `admin-portal/`.
Choice persisted in `project.yaml: static_host`.

## Directory Structure

```
setup/static/
  select.sh                  ← step 5 in install.sh: choose provider, run its setup
  vercel/
    setup.sh                 ← Vercel: install CLI, auth, create 3 projects, set env vars
    check.sh                 ← verify deployments live + env vars set
    deploy.sh                ← deploy all 3 projects (just deploy)
    _redirects               ← not needed (Vercel handles SPA natively)
  cloudflare/
    setup.sh                 ← Wrangler: install, auth, create 3 Pages projects, set env vars
    check.sh
    deploy.sh
    _redirects               ← SPA fallback: /* /index.html 200
  netlify/
    setup.sh                 ← Netlify CLI: install, auth, create 3 sites, set env vars
    check.sh
    deploy.sh
    _redirects               ← SPA fallback: /* /index.html 200
```

## select.sh — provider chooser

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STATIC HOSTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Hosts: landing, client-portal, admin-portal.

  Select provider: (↑↓ move, ↵ select, s=skip)

    ▶ Cloudflare Pages   free unlimited bandwidth, best CDN, own your DNS
      Vercel             best DX, generous free tier, git push = deploy
      Netlify            reliable, good free tier, slightly older DX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Writes choice to `project.yaml: static_host`, then hands off to provider's `setup.sh`.

---

## Provider: Cloudflare Pages

### setup/static/cloudflare/setup.sh

```
STEP N — CLOUDFLARE PAGES SETUP

• Hosts landing, client-portal, admin-portal on Cloudflare's CDN.
• Free unlimited bandwidth. Owns your DNS too.

→ Go to https://dash.cloudflare.com/sign-up (or log in)
→ You'll need your Account ID:
    Dashboard → right sidebar → Account ID → copy

Paste Account ID (s=skip, q=quit): _

[validates by hitting Cloudflare API]

→ Create API token:
    My Profile → API Tokens → Create Token
    Template: "Edit Cloudflare Workers" → use that
    Scope: Account → Cloudflare Pages → Edit

Paste API Token: _

[validates token]

✓ Connected. Creating Pages projects...
  → Creating: [name]-landing
  → Creating: [name]-client-portal
  → Creating: [name]-admin-portal
✓ 3 projects created.

Setting environment variables...
  → VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_ENV, etc.
✓ Env vars set.

Writing wrangler.toml files...
✓ Done. Run: just deploy to publish.
```

**wrangler.toml (per project):**
```toml
name = "[name]-client-portal"
pages_build_output_dir = "dist"
compatibility_date = "2026-01-01"

[env.production]
# env vars set via Cloudflare dashboard / wrangler secret
```

**`_redirects` (SPA routing):**
```
/* /index.html 200
```

Placed in `public/` of each Vite project — copied to `dist/` on build.

**deploy.sh:**
```bash
pnpm run build --filter=landing
pnpm run build --filter=client-portal
pnpm run build --filter=admin-portal
wrangler pages deploy landing/dist --project-name=[name]-landing
wrangler pages deploy client-portal/dist --project-name=[name]-client-portal
wrangler pages deploy admin-portal/dist --project-name=[name]-admin-portal
```

**check.sh verifies:**
- `wrangler` CLI installed
- Token valid (API ping)
- All 3 projects exist
- Env vars set on each project
- Latest deployment live (curl each subdomain, expect 200)

---

## Provider: Vercel

### setup/static/vercel/setup.sh

```
STEP N — VERCEL SETUP

• Hosts landing, client-portal, admin-portal.
• Best DX: git push = auto deploy. Free tier generous.

→ Go to https://vercel.com/signup
→ Settings → Tokens → Create token → copy

Paste Token (s=skip, q=quit): _

[validates token]

✓ Connected. Creating projects...
  → Creating: [name]-landing
  → Creating: [name]-client-portal
  → Creating: [name]-admin-portal

→ Link each to your git repo?
  This enables auto-deploy on push. Requires git_url in project.yaml.
  Link to git? (y/n): _

Setting environment variables...
✓ Done. Run: just deploy to publish.
```

**vercel.json (per project):**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Vercel handles SPA routing natively via `vercel.json` rewrites. No `_redirects` needed.

**deploy.sh:**
```bash
pnpm run build --filter=landing
pnpm run build --filter=client-portal
pnpm run build --filter=admin-portal
vercel deploy landing/dist --prod --token=$VERCEL_TOKEN
vercel deploy client-portal/dist --prod --token=$VERCEL_TOKEN
vercel deploy admin-portal/dist --prod --token=$VERCEL_TOKEN
```

**check.sh verifies:**
- `vercel` CLI installed
- Token valid
- All 3 projects exist
- Env vars set
- Latest deployment URL returns 200

---

## Provider: Netlify

### setup/static/netlify/setup.sh

```
STEP N — NETLIFY SETUP

• Hosts landing, client-portal, admin-portal.
• Reliable, good free tier.

→ Go to https://app.netlify.com/signup
→ User settings → Applications → Personal access tokens → New token

Paste Token (s=skip, q=quit): _

[validates token]

✓ Connected. Creating sites...
  → Creating: [name]-landing
  → Creating: [name]-client
  → Creating: [name]-admin

Setting environment variables...
✓ Done. Run: just deploy to publish.
```

**netlify.toml (per project):**
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**deploy.sh:**
```bash
pnpm run build --filter=landing
pnpm run build --filter=client-portal
pnpm run build --filter=admin-portal
netlify deploy --dir=landing/dist --site=[name]-landing --prod
netlify deploy --dir=client-portal/dist --site=[name]-client --prod
netlify deploy --dir=admin-portal/dist --site=[name]-admin --prod
```

**check.sh verifies:**
- `netlify` CLI installed
- Token valid
- All 3 sites exist
- Env vars set
- Latest deploy URL returns 200

---

## Env vars injected per project

All three frontends get these set in the hosting provider's env var store:

| Var | Source |
|-----|--------|
| `VITE_APP_ENV` | `prod` or `test` |
| `VITE_SUPABASE_URL` | `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` |
| `VITE_API_URL` | derived from domain |
| `VITE_PROJECT_NAME` | `project.yaml` |
| `VITE_DOMAIN` | `project.yaml` |
| `VITE_PRICING_MODEL` | `project.yaml` |
| `VITE_ANALYTICS` | `project.yaml` |
| `VITE_AUTH_PROVIDERS` | `project.yaml` |
| `VITE_DEFAULT_LOCALE` | `project.yaml` |
| `VITE_SUPPORTED_LOCALES` | `project.yaml` |
| `VITE_COMMIT_SHA` | injected at build time via vite.config.ts |
| `VITE_COMMIT_DATE` | injected at build time via vite.config.ts |

`VITE_COMMIT_SHA` + `VITE_COMMIT_DATE` injected by `vite.config.ts` at build time — not set in provider dashboard.

## just deploy

Reads `static_host` from `project.yaml`, runs matching `deploy.sh`:

```bash
HOST=$(read_yaml static_host)
bash setup/static/$HOST/deploy.sh
```

## just deploy test / just deploy prod

Builds with `VITE_APP_ENV=test` or `prod`, deploys to matching environment.
Each provider supports multiple environments (preview vs production).

## Checker

`setup/static/[provider]/check.sh` — called by `just setup health`:
- CLI installed
- Token/credentials valid
- All 3 projects/sites exist
- Env vars set
- Latest deployment returns 200 on each subdomain
