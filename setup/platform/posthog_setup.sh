#!/bin/bash
# setup/platform/posthog_setup.sh — PostHog analytics setup
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

ANALYTICS=$(read_yaml "analytics")
if [ "$ANALYTICS" != "posthog" ]; then
  info "analytics is not 'posthog' in project.yaml — PostHog not needed."
  info "To enable: set 'analytics: posthog' in project.yaml, then re-run: just setup-posthog"
  write_state "posthog" "skipped" "analytics!=posthog"
  exit 0
fi

header "POSTHOG ANALYTICS"
info "Session recording, funnels, feature flags."
warn "Without this: analytics disabled (no tracking at all)."
echo ""

arrow "Go to https://app.posthog.com → New project"
arrow "Settings → Project → API Key → copy"
echo ""

prompt_input "Paste PostHog API key (phc_…)" POSTHOG_KEY || {
  skip "Skipping PostHog. Analytics stays disabled."
  write_state "posthog" "skipped" "analytics disabled"
  exit 0
}

if [[ ! "$POSTHOG_KEY" =~ ^phc_ ]]; then
  warn "Expected key starting with phc_ — continuing anyway."
fi

# Validate
if ! curl -sf -H "Authorization: Bearer $POSTHOG_KEY" "https://app.posthog.com/api/projects/" > /dev/null 2>&1; then
  fail "PostHog API rejected the key."
  write_state "posthog" "fail" "invalid key"
  exit 1
fi

prompt_input "PostHog host (default: https://app.posthog.com)" POSTHOG_HOST || POSTHOG_HOST="https://app.posthog.com"

ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
{
  echo ""
  echo "# PostHog"
  echo "VITE_POSTHOG_KEY=$POSTHOG_KEY"
  echo "VITE_POSTHOG_HOST=$POSTHOG_HOST"
} >> "$ENV_FILE"

write_yaml "analytics" "posthog"
success "PostHog configured."
info "analytics set to 'posthog' in project.yaml."
write_state "posthog" "ok"
