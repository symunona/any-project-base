# any-project-base — justfile
# Install just: https://github.com/casey/just
# Run `just` to list all commands.

# ── All ───────────────────────────────────────────────────────────────────────

# Start all services (supabase + all frontends)
[group: 'All']
dev:
    #!/bin/bash
    echo "Starting supabase..."
    supabase start &
    echo "Starting client-portal..."
    pnpm --filter client-portal dev &
    echo "Starting admin-portal..."
    pnpm --filter admin-portal dev &
    echo "Starting landing..."
    pnpm --filter landing dev &
    wait

# Build all frontend projects
[group: 'All']
build:
    pnpm -r build

# Install all dependencies (runs supply chain checks after)
[group: 'All']
install:
    #!/bin/bash
    set -e
    pnpm install
    echo "Running supply chain checks..."
    pnpm audit --audit-level=high || true
    echo "Supply chain check done. Run GlassWorm manually for deep scan."

# ── Client Portal ─────────────────────────────────────────────────────────────

# Start only client-portal
[group: 'Client Portal']
dev-client:
    pnpm --filter client-portal dev

# Build client-portal only
[group: 'Client Portal']
build-client:
    pnpm --filter client-portal build

# ── Admin Portal ──────────────────────────────────────────────────────────────

# Start only admin-portal
[group: 'Admin Portal']
dev-admin:
    pnpm --filter admin-portal dev

# Build admin-portal only
[group: 'Admin Portal']
build-admin:
    pnpm --filter admin-portal build

# ── Landing ───────────────────────────────────────────────────────────────────

# Start only landing
[group: 'Landing']
dev-landing:
    pnpm --filter landing dev

# Build landing only
[group: 'Landing']
build-landing:
    pnpm --filter landing build

# ── Mobile ────────────────────────────────────────────────────────────────────

# Start Expo (QR code → Expo Go on device)
[group: 'Mobile']
mobile-dev:
    cd mobile-app && expo start

# Start Expo web target (for Playwright testing)
[group: 'Mobile']
mobile-web:
    cd mobile-app && expo start --web

# Install APK on connected Android device via ADB
[group: 'Mobile']
mobile-install:
    cd mobile-app && expo run:android

# Build release APK locally
[group: 'Mobile']
mobile-build:
    cd mobile-app && eas build --platform android --local

# EAS cloud build
[group: 'Mobile']
mobile-eas-build:
    cd mobile-app && eas build --platform android

# Export for web (must succeed in CI — catches native leaks)
[group: 'Mobile']
mobile-export:
    cd mobile-app && expo export --platform web

# ── Database ──────────────────────────────────────────────────────────────────

# Start only supabase local stack
[group: 'Database']
dev-db:
    supabase start

# Reset DB: apply all migrations + seed
[group: 'Database']
db-reset:
    supabase db reset

# Regenerate TypeScript types from local DB schema
[group: 'Database']
db-types:
    supabase gen types typescript --local > commons/types/db.types.ts
    @echo "Regenerated commons/types/db.types.ts"

# Start edge functions server
[group: 'Database']
db-functions:
    supabase functions serve

# Forward Stripe webhooks to local edge function
[group: 'Database']
db-stripe-listen:
    stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# ── Checks ────────────────────────────────────────────────────────────────────

# Run all quality checkers (tsc, eslint, shell checks)
[group: 'Checks']
check:
    #!/bin/bash
    set -e
    echo "→ TypeScript..."
    pnpm tsc --noEmit
    echo "→ ESLint..."
    pnpm eslint .
    echo "→ CSS colors..."
    bash setup/checks/css_color_check.sh
    echo "→ fetch guard..."
    bash setup/checks/fetch_check.sh
    echo "→ i18n..."
    bash setup/checks/i18n_check.sh
    echo "→ paging..."
    bash setup/checks/paging_check.sh
    echo "→ schema drift..."
    bash setup/checks/schema_drift_check.sh
    echo "→ generated files..."
    bash setup/checks/generated_files_check.sh
    echo "→ branding..."
    bash setup/checks/branding_check.sh
    echo "→ unused exports (knip)..."
    pnpm knip
    echo "✓ All checks passed"

# Run only frontend checks
[group: 'Checks']
check-frontend:
    #!/bin/bash
    set -e
    pnpm tsc --noEmit
    pnpm eslint .
    bash setup/checks/css_color_check.sh
    bash setup/checks/fetch_check.sh
    bash setup/checks/i18n_check.sh

# Check cyclomatic complexity (threshold: 8, matches AGENTS.md rule)
[group: 'Checks']
check-complexity:
    pnpm eslint . --rule 'complexity: ["error", 8]'

# Run only supabase checks
[group: 'Checks']
check-db:
    bash setup/checks/supabase_check.sh


# ── Setup ─────────────────────────────────────────────────────────────────────

# Run full guided setup (first-run)
[group: 'Setup']
setup:
    bash setup/install.sh

# Run a specific setup step
[group: 'Setup']
setup-step step:
    bash setup/install.sh --step {{step}}

# Show health status of all platforms
[group: 'Setup']
setup-health:
    bash setup/install.sh --health

# Show setup report
[group: 'Setup']
setup-report:
    bash setup/install.sh --report

# Configure agent selection
[group: 'Setup']
setup-agent:
    bash setup/init/agent.sh

# Apply branding everywhere (from branding/colors.yaml + SVGs)
[group: 'Setup: Branding']
setup-apply-branding:
    bash setup/branding/apply-branding.sh

# Run branding setup step (agent generates palette)
[group: 'Setup: Branding']
setup-branding:
    bash setup/branding/branding.sh

# Walk through missing env vars interactively
[group: 'Setup: Env']
setup-env:
    bash setup/env/env_setup.sh

# Check env vars, show implications of missing ones
[group: 'Setup: Env']
setup-env-check:
    bash setup/env/env_check.sh

# ── Setup: Platforms ──────────────────────────────────────────────────────────

# Configure Stripe (payments)
[group: 'Setup: Platforms']
setup-stripe:
    bash setup/platform/stripe_setup.sh

# Check Stripe config
[group: 'Setup: Platforms']
setup-stripe-check:
    bash setup/platform/stripe_check.sh

# Configure Firebase (auth/storage)
[group: 'Setup: Platforms']
setup-firebase:
    bash setup/platform/firebase_setup.sh

# Check Firebase config
[group: 'Setup: Platforms']
setup-firebase-check:
    bash setup/platform/firebase_check.sh

# Configure PostHog (analytics)
[group: 'Setup: Platforms']
setup-posthog:
    bash setup/platform/posthog_setup.sh

# Check PostHog config
[group: 'Setup: Platforms']
setup-posthog-check:
    bash setup/platform/posthog_check.sh

# Configure DNS
[group: 'Setup: Platforms']
setup-dns:
    bash setup/platform/dns_setup.sh

# Check DNS config
[group: 'Setup: Platforms']
setup-dns-check:
    bash setup/platform/dns_check.sh

# Configure Supabase (database)
[group: 'Setup: Platforms']
setup-supabase:
    bash setup/platform/supabase_setup.sh

# Check Supabase config
[group: 'Setup: Platforms']
setup-supabase-check:
    bash setup/platform/supabase_check.sh

# ── Deploy & Release ──────────────────────────────────────────────────────────

# Deploy to environment: just deploy prod | just deploy test
[group: 'Deploy & Release']
deploy env:
    #!/bin/bash
    set -e
    echo "Deploying to {{env}}..."
    STATIC_HOST=$(grep '^static_host:' project.yaml | awk '{print $2}')
    bash setup/static/$STATIC_HOST/deploy.sh {{env}}
    # Record deployment in DB
    SHA=$(git rev-parse --short HEAD)
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "Recording deployment: $SHA on $BRANCH → {{env}}"

# Cut a pre-release (bumps version, tags, generates release notes)
[group: 'Deploy & Release']
pre-release:
    #!/bin/bash
    set -e
    CURRENT=$(grep '"version"' package.json | head -1 | sed 's/.*"\([^"]*\)".*/\1/')
    echo "Current version: $CURRENT"
    read -p "New pre-release version (e.g. 0.2.0-beta.1): " VERSION
    npm version "$VERSION" --no-git-tag-version
    git add package.json
    git commit -m "chore: bump version to $VERSION"
    git tag "v$VERSION"
    echo "Tagged v$VERSION — push with: git push && git push --tags"

# Cut a release (bumps version, tags, generates release notes)
[group: 'Deploy & Release']
release:
    #!/bin/bash
    set -e
    CURRENT=$(grep '"version"' package.json | head -1 | sed 's/.*"\([^"]*\)".*/\1/')
    echo "Current version: $CURRENT"
    read -p "New release version (e.g. 1.0.0): " VERSION
    npm version "$VERSION" --no-git-tag-version
    git add package.json
    git commit -m "chore: release v$VERSION"
    git tag "v$VERSION"
    echo "Tagged v$VERSION — push with: git push && git push --tags"

# ── Utilities ─────────────────────────────────────────────────────────────────

# List all available commands
[group: 'Utilities']
list:
    @just --list --color always | sed 's/\x1b\[34m/\x1b[36m/g; s/\x1b\[01;34m/\x1b[01;36m/g'
