#!/bin/bash
# setup/platform/toss_setup.sh — Toss Payments setup walkthrough
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"
source "$SETUP_DIR/lib/project_url.sh"

PROVIDER=$(read_yaml "payment_provider")
if [ "$PROVIDER" != "toss" ]; then
  info "payment_provider is not 'toss' in project.yaml — skipping."
  info "To enable: set payment_provider: toss, then re-run: just setup-toss"
  write_state "toss" "skipped" "payment_provider!=toss"
  exit 0
fi

PRICING=$(read_yaml "pricing_model")
if [ "$PRICING" = "none" ] || [ -z "$PRICING" ]; then
  info "pricing_model is 'none' in project.yaml — Toss not needed."
  info "To enable billing: set pricing_model in project.yaml, then re-run: just setup-toss"
  write_state "toss" "skipped" "pricing_model=none"
  exit 0
fi

header "TOSS PAYMENTS"
info "Handles Korean payments: cards, bank transfer, virtual account, Kakao/Naver Pay."
warn "Without this: billing disabled."
echo ""

arrow "Go to https://developers.tosspayments.com"
arrow "내 개발정보 → API 키 → 시크릿 키 (test_sk_... or live_sk_...)"
echo ""

prompt_input "Paste Toss Secret key (test_sk_… or live_sk_…)" TOSS_SECRET_KEY || {
  skip "Skipping Toss. Billing disabled."
  write_state "toss" "skipped" "billing disabled"
  exit 0
}

if [[ ! "$TOSS_SECRET_KEY" =~ ^(test_sk_|live_sk_) ]]; then
  fail "Key should start with test_sk_ or live_sk_"
  write_state "toss" "fail" "invalid key format"
  exit 1
fi

# Validate against Toss API (Basic auth: secretKey:)
ENCODED=$(echo -n "${TOSS_SECRET_KEY}:" | base64)
if ! curl -sf -H "Authorization: Basic $ENCODED" https://api.tosspayments.com/v1/transactions > /dev/null 2>&1; then
  fail "Toss API rejected the key."
  write_state "toss" "fail" "API rejected key"
  exit 1
fi

prompt_input "Paste Toss Client key (test_ck_… or live_ck_…)" TOSS_CLIENT_KEY || TOSS_CLIENT_KEY=""

echo ""
info "Webhook setup:"
arrow "Toss Dashboard → 웹훅 → 웹훅 URL 등록"
warn_if_no_public_url || true
arrow "Endpoint URL: $(get_toss_webhook_url)"
arrow "Webhook auth: Basic ${TOSS_SECRET_KEY}: (Toss sends this header on every call)"
echo ""
info "No separate webhook secret — Toss authenticates with your secret key via Basic auth."

ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
{
  echo ""
  echo "# Toss Payments"
  echo "TOSS_SECRET_KEY=$TOSS_SECRET_KEY"
  [ -n "$TOSS_CLIENT_KEY" ] && echo "TOSS_CLIENT_KEY=$TOSS_CLIENT_KEY"
  [ -n "$TOSS_CLIENT_KEY" ] && echo "VITE_TOSS_CLIENT_KEY=$TOSS_CLIENT_KEY"
} >> "$ENV_FILE"

success "Toss Payments configured."
info "Next: run 'just setup pricing' to select pricing model."
write_state "toss" "ok"
