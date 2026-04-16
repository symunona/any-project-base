# project.yaml

Single source of truth for project-wide configuration. Committed to repo. No secrets — secrets go in `.env.local`.

Written during `just setup` init. Read by all setup scripts, checkers, and build tools.

## Full Schema

```yaml
# ── Identity ──────────────────────────────────────────
name: my-saas                          # used in titles, emails, app names
domain: my-saas.com                    # base domain (no protocol)
tagline: "Your tagline here"
git_url: https://github.com/you/my-saas

# ── Agent ─────────────────────────────────────────────
agent: claude                          # claude | codex | gemini | aider | copilot | echo
agent_flags: "--model claude-sonnet-4-6"

# ── Branding ──────────────────────────────────────────
# Source of truth is branding/colors.yaml — this block synced by apply-branding
theme_colors:
  primary:   "#6366f1"
  secondary: "#8b5cf6"
  accent:    "#06b6d4"
  success:   "#10b981"
  danger:    "#ef4444"

# ── Deployment ────────────────────────────────────────
static_host: cloudflare                # vercel | cloudflare | netlify

# ── Features ──────────────────────────────────────────
pricing_model: credits                 # none | credits | subscription_credits | tiers
analytics: posthog                     # none | posthog
error_monitoring: sentry               # none | sentry — TODO: spec setup/platform/sentry_setup.sh
push_notifications: firebase           # none | firebase

# ── Auth ──────────────────────────────────────────────
auth_providers:
  - email                              # always included
  - google                             # requires setup/auth-providers/google_setup.sh
  - facebook                           # requires setup/auth-providers/facebook_setup.sh

# ── Locales ───────────────────────────────────────────
default_locale: en
supported_locales: [en, es, ko]

# ── Environments ──────────────────────────────────────
envs: [local, test, prod]
```

## Rules

- **No secrets here.** API keys, tokens, passwords → `.env.local` only.
- **Synced fields.** `theme_colors` is written by `just setup apply-branding` — do not edit manually, edit `branding/colors.yaml` instead.
- **Feature flags are additive.** Setting `pricing_model: none` triggers billing removal via agent instruction. Cannot be undone automatically — requires re-running setup.
- **Agent choice persists.** All scripts read `agent` + `agent_flags`. Change via `just setup agent`.

## Reading in scripts

```bash
source setup/lib/yaml.sh  # provides read_yaml()

NAME=$(read_yaml name)
PRICING=$(read_yaml pricing_model)
AGENT=$(read_yaml agent)
```

## Reading in frontend

```typescript
// vite.config.ts injects at build time
// commons/config.ts
export const config = {
  name: import.meta.env.VITE_PROJECT_NAME,
  domain: import.meta.env.VITE_DOMAIN,
  pricingModel: import.meta.env.VITE_PRICING_MODEL,
  analytics: import.meta.env.VITE_ANALYTICS,
  authProviders: import.meta.env.VITE_AUTH_PROVIDERS?.split(',') ?? ['email'],
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE ?? 'en',
  supportedLocales: import.meta.env.VITE_SUPPORTED_LOCALES?.split(',') ?? ['en'],
}
```

`setup/env/env_setup.sh` writes VITE_* vars to `.env.local` from `project.yaml` values at setup time.

## Checker

`setup/checks/project_yaml_check.sh`:
- All required fields present
- `pricing_model` is valid enum value
- `auth_providers` list contains at least `email`
- `theme_colors` keys match `branding/colors.yaml`
- No secrets detected (no keys matching `*_KEY`, `*_SECRET`, `*_TOKEN`)
