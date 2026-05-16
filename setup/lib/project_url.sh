#!/bin/bash
# setup/lib/project_url.sh — derive public URLs from .env.local
# Source this in any setup script that needs webhook or public URLs.
# Requires ui.sh to be sourced first (for warn/arrow/info).

_PROJECT_URL_ENV="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/.env.local"

_read_env_val() {
  grep "^${1}=" "$_PROJECT_URL_ENV" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'"
}

get_supabase_url() {
  _read_env_val "VITE_SUPABASE_URL"
}

get_site_url() {
  _read_env_val "SITE_URL"
}

get_stripe_webhook_url() {
  echo "$(_read_env_val VITE_SUPABASE_URL)/functions/v1/stripe-webhook"
}

get_toss_webhook_url() {
  echo "$(_read_env_val VITE_SUPABASE_URL)/functions/v1/toss-webhook"
}

# Call before showing a webhook URL to the user.
# Warns (but does not exit) if URL is unset or points to localhost.
warn_if_no_public_url() {
  local supabase_url
  supabase_url=$(_read_env_val "VITE_SUPABASE_URL")

  if [ -z "$supabase_url" ]; then
    warn "VITE_SUPABASE_URL not set — cannot derive webhook URL."
    warn "Run supabase setup first, then return here:"
    arrow "just setup-supabase"
    return 1
  fi

  if [[ "$supabase_url" == *"localhost"* ]] || [[ "$supabase_url" == *"127.0.0.1"* ]]; then
    warn "VITE_SUPABASE_URL is localhost — external services cannot reach it."
    warn "Set up a public URL first:"
    arrow "just setup-nginx      (public dev domain via nginx + Let's Encrypt)"
    arrow "just deploy           (deploy to production)"
    warn "Then re-run this step to get the correct webhook URL."
    return 1
  fi

  return 0
}
