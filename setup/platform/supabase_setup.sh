#!/bin/bash
# setup/platform/supabase_setup.sh — Supabase cloud setup walkthrough
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"

# Read existing value from .env.local (empty string if not set)
read_env() {
  grep "^${1}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'"
}

# Write only if key not already set to a non-empty value
set_env() {
  local key=$1 value=$2
  [ -z "$value" ] && return
  if grep -q "^${key}=.\+" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    sed -i "/^${key}=$/d" "$ENV_FILE" 2>/dev/null || true
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

# prompt_input_with_default — shows existing value, lets user keep or replace
# Returns 1 if user skips (s), sets varname to new or existing value
prompt_input_default() {
  local label=$1 varname=$2 existing=$3
  if [ -n "$existing" ]; then
    local masked="${existing:0:16}…"
    printf "  ${YELLOW}%s${RESET} ${DIM}[current: %s — Enter to keep, or paste new]${RESET}: " "$label" "$masked"
  else
    printf "  ${YELLOW}%s${RESET} ${DIM}(s=skip, q=quit)${RESET}: " "$label"
  fi
  read -r input
  if [[ "$input" == "q" ]]; then echo ""; info "Quitting setup."; exit 0; fi
  if [[ "$input" == "s" ]]; then return 1; fi
  if [[ -z "$input" && -n "$existing" ]]; then
    eval "$varname='$existing'"  # keep existing
  else
    eval "$varname='$input'"
  fi
  return 0
}

header "SUPABASE CLOUD"
info "Supabase hosts your database, auth, and edge functions."
warn "Without this: app runs on local Docker only."
echo ""

info "In your Supabase dashboard:"
arrow "1. Go to https://supabase.com/dashboard → select your project"
arrow "2. Left sidebar → Settings → API"
arrow "3. Copy 'Project URL' (https://xxxx.supabase.co)"
echo ""

EXISTING_URL=$(read_env "VITE_SUPABASE_URL")
prompt_input_default "Supabase Project URL (https://xxxx.supabase.co)" SUPABASE_URL "$EXISTING_URL" || {
  skip "Skipping Supabase cloud. Local dev still works."
  write_state "supabase" "skipped" "local dev only"
  exit 0
}

echo ""
info "Still in Settings → API → 'Project API keys':"
arrow "Copy the 'Publishable' key  (new UI)  — or 'anon public' (legacy UI)"
echo ""

EXISTING_ANON=$(read_env "VITE_SUPABASE_ANON_KEY")
prompt_input_default "Publishable / anon key" SUPABASE_ANON_KEY "$EXISTING_ANON" || {
  skip "Skipping."
  write_state "supabase" "skipped"
  exit 0
}

echo ""
arrow "Copy the 'Secret' key  (new UI)  — or 'service_role' (legacy UI)"
warn "Keep this secret — never commit it or expose it client-side."
echo ""

EXISTING_SERVICE=$(read_env "SUPABASE_SERVICE_ROLE_KEY")
prompt_input_default "Secret / service_role key" SUPABASE_SERVICE_KEY "$EXISTING_SERVICE" || {
  skip "Skipping."
  write_state "supabase" "skipped"
  exit 0
}

# Validate — hit /rest/v1/ with publishable key
info "Validating connection…"
if ! curl -sf -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/" > /dev/null 2>&1; then
  fail "Cannot reach Supabase project. Check URL and keys."
  write_state "supabase" "fail" "connection failed"
  exit 1
fi

[ ! -f "$ENV_FILE" ] && touch "$ENV_FILE"
set_env "SUPABASE_URL"           "$SUPABASE_URL"
set_env "VITE_SUPABASE_URL"      "$SUPABASE_URL"
set_env "VITE_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
set_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_KEY"

success "Supabase cloud configured."
info "Next steps:"
arrow "just db-push          — push migrations to cloud DB"
arrow "just deploy-secrets   — push env vars to edge functions"
arrow "just deploy-functions — deploy edge functions"
write_state "supabase" "ok" "$SUPABASE_URL"
