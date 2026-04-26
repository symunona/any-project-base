#!/bin/bash
# setup/env/env_generate.sh — auto-populate .env.local from project.yaml + supabase status
# Safe to re-run: only writes vars not already present.
set -euo pipefail

SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

ENV_FILE="$ROOT_DIR/.env.local"
PROJECT_YAML="$ROOT_DIR/project.yaml"

[ -f "$ENV_FILE" ] || touch "$ENV_FILE"

header "ENV GENERATE"
info "Auto-filling .env.local from project.yaml + supabase status."
info "Skips vars already set. Safe to re-run."
echo ""

# Write var only if key not already present in .env.local
set_env() {
  local key=$1 value=$2
  [ -z "$value" ] && return
  grep -q "^${key}=.\+" "$ENV_FILE" 2>/dev/null && return  # already has a non-empty value
  # Remove any existing empty entry for this key, then append
  sed -i "/^${key}=$/d" "$ENV_FILE" 2>/dev/null || true
  echo "${key}=${value}" >> "$ENV_FILE"
  success "$key"
}

# ── From project.yaml ─────────────────────────────────
printf "  ${BOLD}project.yaml${RESET}\n"

set_env "VITE_APP_ENV" "local"
set_env "VITE_PROJECT_NAME" "$(read_yaml name)"
set_env "VITE_DOMAIN"       "$(read_yaml domain)"
set_env "VITE_PRICING_MODEL" "$(read_yaml pricing_model)"
set_env "VITE_ANALYTICS"    "$(read_yaml analytics)"
set_env "VITE_DEFAULT_LOCALE" "$(read_yaml default_locale)"

# auth_providers is a yaml list — join as comma-separated
AUTH_PROVIDERS=$(grep -A10 '^auth_providers:' "$PROJECT_YAML" \
  | grep '^\s*-' | awk '{print $2}' | tr '\n' ',' | sed 's/,$//')
set_env "VITE_AUTH_PROVIDERS" "$AUTH_PROVIDERS"

# supported_locales is a yaml inline list [en, fr, ...]
SUPPORTED_LOCALES=$(grep '^supported_locales:' "$PROJECT_YAML" \
  | sed 's/supported_locales:[[:space:]]*//' | tr -d '[]' | tr -d ' ')
set_env "VITE_SUPPORTED_LOCALES" "$SUPPORTED_LOCALES"

# ── App URLs ──────────────────────────────────────────
echo ""
printf "  ${BOLD}App URLs${RESET}\n"
PROJECT=$(read_yaml name)
set_env "SITE_URL"      "http://portal.${PROJECT}.localhost"
set_env "VITE_APP_URL"  "http://portal.${PROJECT}.localhost"

# ── Supabase static defaults ──────────────────────────
echo ""
printf "  ${BOLD}Supabase (static)${RESET}\n"
set_env "VITE_SUPABASE_URL" "http://localhost:54321"
set_env "VITE_API_URL"      "http://localhost:54321/functions/v1/api"

# ── Supabase from `supabase status` ──────────────────
echo ""
if supabase status &>/dev/null 2>&1; then
  printf "  ${BOLD}Supabase (from status)${RESET}\n"
  STATUS=$(supabase status 2>/dev/null)
  # New Supabase CLI uses table format: │ Publishable │ sb_publishable_... │
  # Old format used "anon key:" / "service_role key:" labels.
  # || true prevents set -e exit when grep finds no match.
  ANON_KEY=$(echo "$STATUS"    | grep -oE 'sb_publishable_[A-Za-z0-9_]+' || true)
  SERVICE_KEY=$(echo "$STATUS" | grep -oE 'sb_secret_[A-Za-z0-9_-]+' || true)
  DB_URL=$(echo "$STATUS"      | grep -oE 'postgresql://[^[:space:]]+' || true)
  DB_PASSWORD=$(echo "$DB_URL" | sed 's|.*://[^:]*:\([^@]*\)@.*|\1|' || true)

  set_env "VITE_SUPABASE_ANON_KEY"    "$ANON_KEY"
  set_env "SUPABASE_SERVICE_ROLE_KEY" "$SERVICE_KEY"
  set_env "SUPABASE_DB_PASSWORD"      "$DB_PASSWORD"
else
  warn "Supabase not running — skipping anon/service_role keys."
  info "Run: just start && just env-generate"
fi

# ── Defaults ──────────────────────────────────────────
echo ""
printf "  ${BOLD}Defaults${RESET}\n"
DOMAIN=$(read_yaml domain)
set_env "SMTP_PORT"         "587"
set_env "SMTP_FROM"         "noreply@${DOMAIN}"
set_env "VITE_POSTHOG_HOST" "https://app.posthog.com"

# ── Derived from already-set vars ────────────────────
echo ""
printf "  ${BOLD}Derived${RESET}\n"

# VITE_STRIPE_PUBLISHABLE_KEY = STRIPE_PUBLISHABLE_KEY
if grep -q "^STRIPE_PUBLISHABLE_KEY=.\+" "$ENV_FILE" 2>/dev/null; then
  PK=$(grep "^STRIPE_PUBLISHABLE_KEY=" "$ENV_FILE" | cut -d= -f2-)
  set_env "VITE_STRIPE_PUBLISHABLE_KEY" "$PK"
fi

# VITE_FIREBASE_AUTH_DOMAIN = {project_id}.firebaseapp.com
if grep -q "^VITE_FIREBASE_PROJECT_ID=.\+" "$ENV_FILE" 2>/dev/null; then
  FID=$(grep "^VITE_FIREBASE_PROJECT_ID=" "$ENV_FILE" | cut -d= -f2-)
  set_env "VITE_FIREBASE_AUTH_DOMAIN" "${FID}.firebaseapp.com"
fi

echo ""
success "Done."
info "Run 'just status' to see what's still missing."
info "Run 'just setup-stripe' / 'just setup-firebase' for service keys."
