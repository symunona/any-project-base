#!/bin/bash
# setup/platform/stripe_setup.sh — Stripe setup walkthrough
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

header "STRIPE"
info "Handles payments, subscriptions, and credits."
warn "Without this: billing disabled → pricing_model stays 'none'."
echo ""

arrow "Go to https://dashboard.stripe.com/register"
arrow "Settings → Developers → API keys → copy Secret key (sk_live_… or sk_test_…)"
echo ""

prompt_input "Paste Stripe Secret key" STRIPE_SECRET_KEY || {
  skip "Skipping Stripe. Billing disabled."
  write_state "stripe" "skipped" "billing disabled"
  exit 0
}

# Validate key format
if [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_(test|live)_ ]]; then
  fail "Key should start with sk_test_ or sk_live_"
  write_state "stripe" "fail" "invalid key format"
  exit 1
fi

# Validate against Stripe API
if ! curl -sf -u "$STRIPE_SECRET_KEY:" https://api.stripe.com/v1/account > /dev/null 2>&1; then
  fail "Stripe API rejected the key."
  write_state "stripe" "fail" "API rejected key"
  exit 1
fi

prompt_input "Paste Stripe Publishable key (pk_…)" STRIPE_PK || STRIPE_PK=""

# Webhook setup
echo ""
info "Webhook setup:"
arrow "Stripe Dashboard → Developers → Webhooks → Add endpoint"
arrow "Endpoint URL: https://api.[domain]/stripe-webhook"
arrow "Events: customer.subscription.*, invoice.*, payment_intent.*"
arrow "Copy Webhook Signing Secret (whsec_…)"
echo ""
prompt_input "Paste Webhook Signing Secret (whsec_…)" STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET=""

ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
{
  echo ""
  echo "# Stripe"
  echo "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
  [ -n "$STRIPE_PK" ] && echo "VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PK"
  [ -n "$STRIPE_WEBHOOK_SECRET" ] && echo "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
} >> "$ENV_FILE"

success "Stripe configured."
info "Next: run 'just setup pricing' to select pricing model."
write_state "stripe" "ok"
