# Local setup

## 1. Prerequisites

Install these once on your machine:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 20 | https://nodejs.org or `nvm install 20` |
| pnpm | >= 10 | `npm install -g pnpm` |
| Docker | any | https://docker.com/products/docker-desktop |
| just | any | `brew install just` / `cargo install just` / `snap install --edge just` |
| Supabase CLI | any | `brew install supabase/tap/supabase` / `npm install -g supabase` |

Or run the tooling check which installs most of them:

```bash
just setup-step tooling
```

## 2. Install dependencies

```bash
just install
```

## 3. Start local Supabase

```bash
supabase start
```

This starts Postgres + Auth + Edge Functions locally in Docker.
First run takes a few minutes to pull images.

Local dashboard: http://localhost:54323
Local API URL: http://localhost:54321

## 4. Copy env file and fill in values

```bash
cp .env.local.example .env.local
```

Edit `.env.local` — at minimum set:

```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<from: supabase start output>
VITE_API_URL=http://localhost:54321/functions/v1
VITE_APP_ENV=local
VITE_PROJECT_NAME=MyApp
```

Or run the interactive env wizard:

```bash
just setup-env
```

## 5. Apply migrations and seed

```bash
just db-reset
```

## 6. Start everything

```bash
just dev
```

Starts: Supabase, client-portal (5173), admin-portal (5174), landing (5175).

Or start services individually:

```bash
just dev-client     # client portal only
just dev-admin      # admin portal only
just dev-landing    # landing only
just dev-db         # supabase only
```

## 7. Verify

```bash
just check
```

Should exit clean. If not, see error output — each checker prints what failed and where.

---

## Platform setup (optional, cloud)

Run the guided wizard to wire up cloud platforms:

```bash
just setup
```

Steps (all skippable):
- Branding (colors, logos)
- DNS
- Static hosting (Vercel / Netlify / Cloudflare)
- Mobile (Expo / EAS)
- Supabase cloud project
- Stripe (payments)
- Firebase (push notifications)
- PostHog (analytics)
- Pricing model

Run a single step at any time:

```bash
just setup-step stripe
just setup-step posthog
```

## Mobile (optional)

```bash
just mobile-dev     # Expo QR code → scan with Expo Go
just mobile-web     # web target (browser)
```

Requires Expo Go on your phone for the QR flow.
