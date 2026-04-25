# any-project-base — justfile
# Install just: https://github.com/casey/just
# Run `just` to list all commands.

# ── All ───────────────────────────────────────────────────────────────────────

# Start everything: port check → Supabase → env-generate → all 3 frontend servers
[group: 'All']
start:
    #!/bin/bash
    set -e

    # Bail if the stack is running as a managed system service
    PROJECT=$(grep '^name:' project.yaml | awk '{print $2}')
    if systemctl is-active --quiet "${PROJECT}-dev" 2>/dev/null; then
      echo ""
      echo "  ⚠  '${PROJECT}-dev' is running as a system service."
      echo "  ⚠  Starting Vite dev servers alongside it will conflict."
      echo "  ⚠  To redeploy: just deploy-local-service"
      echo "  ⚠  To stop the service: sudo systemctl stop ${PROJECT}-dev"
      exit 1
    fi

    # Warn if nginx localdev is configured — dev stack is reachable on the network
    LOCALDEV_CONFIG="setup/dev/.localdev-config"
    if [ -f "$LOCALDEV_CONFIG" ] && systemctl is-active --quiet nginx 2>/dev/null; then
      _IP=$(grep "^IP=" "$LOCALDEV_CONFIG" | cut -d= -f2)
      _PORTAL=$(grep "^URL_PORTAL=" "$LOCALDEV_CONFIG" | cut -d= -f2)
      _ADMIN=$(grep "^URL_ADMIN=" "$LOCALDEV_CONFIG" | cut -d= -f2)
      _API=$(grep "^URL_API=" "$LOCALDEV_CONFIG" | cut -d= -f2)
      _TS_IP=$(ip addr show tailscale0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1 || true)
      _TS_HOST=$(tailscale status 2>/dev/null | grep -E "^\s*${_TS_IP}" | awk '{print $2}' || true)
      echo ""
      echo "  ⚠  ⚠  ⚠  NGINX LOCALDEV IS ACTIVE  ⚠  ⚠  ⚠"
      echo "  ⚠  Your dev stack is LIVE on the network (IP: ${_IP})"
      echo "  ⚠  ${_PORTAL}"
      echo "  ⚠  ${_ADMIN}"
      echo "  ⚠  ${_API}  ← Supabase API + keys exposed"
      if [ -n "$_TS_IP" ]; then
        echo "  ⚠  Tailscale: ${_TS_IP}${_TS_HOST:+ (${_TS_HOST})} — visible to your Tailnet"
      fi
      echo "  ⚠  Run 'sudo nginx -s stop' to take it offline."
      echo ""
    fi

    # Auto-install if tools missing
    if ! supabase --version > /dev/null 2>&1 || ! caddy version > /dev/null 2>&1; then
      echo "Required tools missing — running just install first..."
      just install
    fi

    # Create .env.local from example if missing
    if [ ! -f .env.local ]; then
      cp .env.local.example .env.local
      echo "Created .env.local from .env.local.example"
    fi

    # Check ports — kill and retry once if busy
    if ! just port-check; then
      echo "Ports busy — running just kill..."
      just kill
      if ! just port-check; then
        echo "Ports still busy after kill. Check manually."
        exit 1
      fi
    fi

    # Start Supabase (blocking until ready)
    supabase start

    # Auto-fill env vars from project.yaml + supabase status
    just env-generate

    # Start Caddy reverse proxy (*.localhost subdomains → Vite ports)
    bash setup/dev/caddy_start.sh

    # Show remote URLs if nginx localdev is configured
    if [ -f "setup/dev/.localdev-config" ] && systemctl is-active --quiet nginx 2>/dev/null; then
      _LD=$(grep "^URL_LANDING=" setup/dev/.localdev-config | cut -d= -f2)
      _PO=$(grep "^URL_PORTAL="  setup/dev/.localdev-config | cut -d= -f2)
      _AD=$(grep "^URL_ADMIN="   setup/dev/.localdev-config | cut -d= -f2)
      _AP=$(grep "^URL_API="     setup/dev/.localdev-config | cut -d= -f2)
      _TS=$(ip addr show tailscale0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1 || true)
      _W1=14; _W2=$(( ${#_AP} + 2 )); [ $_W2 -lt 44 ] && _W2=44
      _S1=$(printf '─%.0s' $(seq 1 $((_W1 + 2))))
      _S2=$(printf '─%.0s' $(seq 1 $((_W2 + 1))))
      echo ""
      printf "  \033[1mRemote (Nginx)\033[0m\n"
      printf "╭%s┬%s╮\n" "$_S1" "$_S2"
      printf "│ %-${_W1}s │ %-${_W2}s│\n" "Landing"       "$_LD"
      printf "│ %-${_W1}s │ %-${_W2}s│\n" "Client Portal" "$_PO"
      printf "│ %-${_W1}s │ %-${_W2}s│\n" "Admin Portal"  "$_AD"
      printf "│ %-${_W1}s │ %-${_W2}s│\n" "Supabase API"  "$_AP"
      printf "╰%s┴%s╯\n" "$_S1" "$_S2"
      [ -n "$_TS" ] && printf "  \033[2mTailscale: %s\033[0m\n" "$_TS"
    fi

    # Show nip.io quicklinks when Tailscale is detected
    _TS_NIP=$(ip addr show tailscale0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1 || true)
    if [ -n "$_TS_NIP" ]; then
      _NB="${_TS_NIP}.nip.io"
      _NIP_LD="http://${_NB}"
      _NIP_PO="http://portal.${_NB}"
      _NIP_AD="http://admin.${_NB}"
      _NIP_AP="http://api.${_NB}"
      _NW2=$(( ${#_NIP_AP} + 2 )); [ $_NW2 -lt 44 ] && _NW2=44
      _NS1=$(printf '─%.0s' $(seq 1 16))
      _NS2=$(printf '─%.0s' $(seq 1 $((_NW2 + 1))))
      echo ""
      if systemctl is-active --quiet nginx 2>/dev/null; then
        printf "  \033[1mTailscale / nip.io\033[0m\n"
      else
        printf "  \033[1mTailscale / nip.io\033[0m  \033[2m(needs: just setup-nginx-localdev)\033[0m\n"
      fi
      printf "╭%s┬%s╮\n" "$_NS1" "$_NS2"
      printf "│ %-14s │ %-${_NW2}s│\n" "Landing"       "$_NIP_LD"
      printf "│ %-14s │ %-${_NW2}s│\n" "Client Portal" "$_NIP_PO"
      printf "│ %-14s │ %-${_NW2}s│\n" "Admin Portal"  "$_NIP_AD"
      printf "│ %-14s │ %-${_NW2}s│\n" "Supabase API"  "$_NIP_AP"
      printf "╰%s┴%s╯\n" "$_NS1" "$_NS2"
    fi

    # Ctrl+C kills Vite + Caddy but leaves Supabase (Docker — slow to restart)
    trap '
      kill 0
      echo ""
      echo "  ⚠  Vite servers and Caddy stopped."
      echo "  ⚠  Supabase is still running (Docker stack left intentionally)."
      echo "  ⚠  Run \033[1mjust kill\033[0m to stop Supabase too."
    ' INT TERM

    # Start all frontend dev servers
    pnpm --filter client-portal dev &
    pnpm --filter admin-portal dev &
    pnpm --filter landing dev &
    wait

# Check all dev ports are free
[group: 'All']
port-check:
    bash setup/checks/port_check.sh

# Kill all dev servers, stop Supabase and Caddy
[group: 'All']
kill:
    #!/bin/bash
    echo "→ Stopping Supabase..."
    supabase stop 2>/dev/null || true
    echo "→ Stopping Caddy..."
    caddy stop 2>/dev/null || true
    echo "→ Killing frontend servers..."
    for port in 5173 5174 5175; do
      lsof -ti:"$port" 2>/dev/null | xargs kill -9 2>/dev/null || true
    done
    echo "Done."

# Build all frontend projects
[group: 'All']
build:
    pnpm -r build

# Remove tools installed by this project (skips pre-existing). Asks for confirmation.
[group: 'All']
cleanup-env:
    bash setup/dev/tooling_cleanup.sh

# Install everything: system tools (supabase CLI, Docker, just) + node deps + supply chain check
[group: 'All']
install:
    #!/bin/bash
    set -e
    echo "→ Checking system tools..."
    bash setup/dev/tooling_setup.sh
    echo "→ Installing node dependencies..."
    pnpm install
    echo "→ Running supply chain checks..."
    bash setup/checks/supply_chain_audit.sh
    echo "Run 'just security-autofix' to auto-patch patchable issues."

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


# ── Security ──────────────────────────────────────────────────────────────────

# Summarise pnpm audit + glassworm scan (clean output, no wall of text)
[group: 'Security']
security-audit:
    bash setup/checks/supply_chain_audit.sh

# Auto-fix patchable vulnerabilities: bumps direct deps + adds pnpm.overrides for transitive
[group: 'Security']
security-autofix:
    bash setup/checks/supply_chain_autofix.sh

# ── Setup ─────────────────────────────────────────────────────────────────────

# Run full guided setup (first-run sequential, re-run pick-a-step menu)
[group: 'Setup']
setup:
    npx tsx setup/install.ts

# Run a specific setup step
[group: 'Setup']
setup-step step:
    bash setup/install.sh --step {{step}}

# Show status of all platforms and env vars at a glance
[group: 'Setup']
status:
    bash setup/status.sh

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

# Install recommended Claude Code plugins for this repo (context7, caveman)
[group: 'Setup']
plugin-install:
    #!/bin/bash
    set -e
    echo "Installing recommended Claude Code plugins..."
    if ! command -v claude &>/dev/null; then
      echo "claude CLI not found — install Claude Code first: https://claude.ai/code"
      exit 1
    fi
    claude plugin install context7
    claude plugin install caveman
    echo "Done. Add more anytime: claude plugin install <name>"

# Generate Caddyfile from project.yaml and start/reload Caddy (*.localhost subdomains)
[group: 'Setup']
setup-caddy:
    bash setup/dev/caddy_start.sh

# Set up Nginx reverse proxy for VPS/remote dev access via nip.io subdomains (dev mode)
[group: 'Setup']
setup-nginx-localdev:
    bash setup/dev/nginx_localdev.sh dev

# Set up Nginx + systemd service for persistent VPS deployment (serves built dist/)
[group: 'Setup']
setup-service-localdev:
    bash setup/dev/service_localdev.sh

# Build all apps and reload the local service (use after code changes on VPS)
[group: 'Deploy & Release']
deploy-local-service:
    bash setup/dev/deploy_local_service.sh

# Apply branding everywhere (from branding/colors.yaml + SVGs)
[group: 'Setup: Branding']
setup-apply-branding:
    bash setup/branding/apply-branding.sh

# Run branding setup step (agent generates palette)
[group: 'Setup: Branding']
setup-branding:
    bash setup/branding/branding.sh

# Auto-fill env vars from project.yaml + supabase status (safe to re-run)
[group: 'Setup: Env']
env-generate:
    bash setup/env/env_generate.sh

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
