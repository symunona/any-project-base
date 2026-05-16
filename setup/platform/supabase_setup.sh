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

info "In your Supabase dashboard:"
arrow "1. Go to https://supabase.com/dashboard → select your project"
arrow "2. Left sidebar → Settings → API"
arrow "3. Copy 'Project URL' (https://xxxx.supabase.co)"
echo ""

prompt_input "Supabase Project URL (https://xxxx.supabase.co)" SUPABASE_URL || {
  skip "Skipping Supabase cloud. Local dev still works."
  write_state "supabase" "skipped" "local dev only"
  exit 0
}

echo ""
info "Still in Settings → API → 'Project API keys':"
arrow "Copy the 'Publishable' key  (new UI)  — or 'anon public' (legacy UI)"
echo ""

prompt_input "Publishable / anon key (starts with eyJ… or sb_publishable_…)" SUPABASE_ANON_KEY || {
  skip "Skipping."
  write_state "supabase" "skipped"
  exit 0
}

echo ""
arrow "Copy the 'Secret' key  (new UI)  — or 'service_role' (legacy UI)"
warn "Keep this secret — never commit it or expose it client-side."
echo ""

prompt_input "Secret / service_role key" SUPABASE_SERVICE_KEY || {
  skip "Skipping."
  write_state "supabase" "skipped"
  exit 0
}

# Validate — hit /rest/v1/ with publishable key
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
info "Next steps:"
arrow "just db-push        — push migrations to cloud DB"
arrow "just deploy-secrets — push env vars to edge functions"
arrow "just deploy-functions — deploy edge functions"
write_state "supabase" "ok" "$SUPABASE_URL"
