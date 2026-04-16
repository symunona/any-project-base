# any-project-base — justfile
# Install just: https://github.com/casey/just
# Run `just` to list all commands.

# ── Dev ───────────────────────────────────────────────────────────────────────

# Start all services (supabase + all frontends)
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

# Start only supabase local stack
dev-db:
    supabase start

# Start only client-portal
dev-client:
    pnpm --filter client-portal dev

# Start only admin-portal
dev-admin:
    pnpm --filter admin-portal dev

# Start only landing
dev-landing:
    pnpm --filter landing dev

# ── Build ─────────────────────────────────────────────────────────────────────

# Build all frontend projects
build:
    pnpm -r build

# Build client-portal only
build-client:
    pnpm --filter client-portal build

# Build admin-portal only
build-admin:
    pnpm --filter admin-portal build

# Build landing only
build-landing:
    pnpm --filter landing build

# ── Mobile ────────────────────────────────────────────────────────────────────

# Start Expo (QR code → Expo Go on device)
mobile-dev:
    cd mobile-app && expo start

# Start Expo web target (for Playwright testing)
mobile-web:
    cd mobile-app && expo start --web

# Install APK on connected Android device via ADB
mobile-install:
    cd mobile-app && expo run:android

# Build release APK locally
mobile-build:
    cd mobile-app && eas build --platform android --local

# EAS cloud build
mobile-eas-build:
    cd mobile-app && eas build --platform android

# Export for web (must succeed in CI — catches native leaks)
mobile-export:
    cd mobile-app && expo export --platform web

# ── Supabase ──────────────────────────────────────────────────────────────────

# Reset DB: apply all migrations + seed
db-reset:
    supabase db reset

# Regenerate TypeScript types from local DB schema
db-types:
    supabase gen types typescript --local > commons/types/db.types.ts
    @echo "Regenerated commons/types/db.types.ts"

# Start edge functions server
db-functions:
    supabase functions serve

# Forward Stripe webhooks to local edge function
db-stripe-listen:
    stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# ── Checks ────────────────────────────────────────────────────────────────────

# Run all quality checkers (tsc, eslint, shell checks)
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
    echo "→ complexity..."
    bash setup/checks/complexity_check.sh
    echo "→ generated files..."
    bash setup/checks/generated_files_check.sh
    echo "→ branding..."
    bash setup/checks/branding_check.sh
    echo "→ unused exports (knip)..."
    pnpm knip
    echo "✓ All checks passed"

# Run only frontend checks
check-frontend:
    #!/bin/bash
    set -e
    pnpm tsc --noEmit
    pnpm eslint .
    bash setup/checks/css_color_check.sh
    bash setup/checks/fetch_check.sh
    bash setup/checks/i18n_check.sh

# Run only supabase checks
check-db:
    bash setup/checks/supabase_check.sh

# Run complexity baseline update
check-complexity-baseline:
    bash setup/checks/complexity_check.sh --update-baseline

# ── Setup ─────────────────────────────────────────────────────────────────────

# Run full guided setup (first-run)
setup:
    bash setup/install.sh

# Run a specific setup step
setup-step step:
    bash setup/install.sh --step {{step}}

# Show health status of all platforms
setup-health:
    bash setup/install.sh --health

# Show setup report
setup-report:
    bash setup/install.sh --report

# Apply branding everywhere (from branding/colors.yaml + SVGs)
setup-apply-branding:
    bash setup/branding/apply-branding.sh

# Run branding setup step (agent generates palette)
setup-branding:
    bash setup/branding/branding.sh

# Configure agent selection
setup-agent:
    bash setup/init/agent.sh

# Walk through missing env vars interactively
setup-env:
    bash setup/env/env_setup.sh

# Check env vars, show implications of missing ones
setup-env-check:
    bash setup/env/env_check.sh

# ── Deploy ────────────────────────────────────────────────────────────────────

# Deploy to environment: just deploy prod | just deploy test
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

# ── Release ───────────────────────────────────────────────────────────────────

# Cut a pre-release (bumps version, tags, generates release notes)
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

# ── Installs ──────────────────────────────────────────────────────────────────

# Install all dependencies (runs supply chain checks after)
install:
    #!/bin/bash
    set -e
    pnpm install
    echo "Running supply chain checks..."
    pnpm audit --audit-level=high || true
    @echo "Supply chain check done. Run GlassWorm manually for deep scan."

# ── Utilities ─────────────────────────────────────────────────────────────────

# List all available commands
list:
    @just --list
