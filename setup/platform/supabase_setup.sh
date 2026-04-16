#!/bin/bash
# setup/platform/supabase_setup.sh — Supabase cloud setup walkthrough
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

header "SUPABASE CLOUD"
info "Supabase hosts your database, auth, and edge functions."
warn "Without this: app runs on local Docker only."
echo ""

arrow "Go to https://supabase.com → New Project"
arrow "Copy: Project URL, anon key, service_role key"
echo ""

prompt_input "Supabase Project URL (https://xxx.supabase.co)" SUPABASE_URL || {
  skip "Skipping Supabase cloud. Local dev still works."
  write_state "supabase" "skipped" "local dev only"
  exit 0
}

prompt_input "Supabase anon key (starts with eyJ…)" SUPABASE_ANON_KEY || { skip "Skipping."; write_state "supabase" "skipped"; exit 0; }
prompt_input "Supabase service_role key (keep secret)" SUPABASE_SERVICE_KEY || { skip "Skipping."; write_state "supabase" "skipped"; exit 0; }

# Validate — hit /rest/v1/ with anon key
if ! curl -sf -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/" > /dev/null 2>&1; then
  fail "Cannot reach Supabase project. Check URL and keys."
  write_state "supabase" "fail" "connection failed"
  exit 1
fi

# Write to .env.local
ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
{
  echo ""
  echo "# Supabase cloud"
  echo "SUPABASE_URL=$SUPABASE_URL"
  echo "VITE_SUPABASE_URL=$SUPABASE_URL"
  echo "VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
  echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY"
} >> "$ENV_FILE"

success "Supabase cloud configured."
info "Next: run migrations → just db-types to generate types."
write_state "supabase" "ok" "$SUPABASE_URL"
