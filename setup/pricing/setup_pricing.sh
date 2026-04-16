#!/bin/bash
# setup/pricing/setup_pricing.sh — pricing model selection
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"
source "$SETUP_DIR/lib/agent.sh"

header "PRICING MODEL"
info "Choose how you charge users. Stored in project.yaml."
warn "Stripe must be configured first for paid models."
echo ""

MODELS=(
  "none|None — no billing. Free app."
  "credits|Credits — users buy token bundles. Atomic deduction."
  "subscription|Subscription — monthly/annual plans via Stripe."
  "credits+subscription|Hybrid — subscription with credit top-ups."
)

selected=0
TOTAL=${#MODELS[@]}

printf "  ${DIM}↑↓ move, ↵ select${RESET}\n"
echo ""

while true; do
  for i in "${!MODELS[@]}"; do
    IFS='|' read -r key label <<< "${MODELS[$i]}"
    if [ "$i" -eq "$selected" ]; then
      printf "  ${CYAN}${ICON_CURSOR}${RESET}  ${BOLD}%s${RESET}  ${DIM}%s${RESET}\n" "$key" "$label"
    else
      printf "     ${DIM}%s${RESET}\n" "$key"
    fi
  done
  echo ""

  action=$(read_key)
  case $action in
    up)    [ "$selected" -gt 0 ] && selected=$((selected - 1)); tput cuu $((TOTAL + 2)) 2>/dev/null || true ;;
    down)  [ "$selected" -lt $((TOTAL - 1)) ] && selected=$((selected + 1)); tput cuu $((TOTAL + 2)) 2>/dev/null || true ;;
    enter) break ;;
  esac
done

IFS='|' read -r PRICING_KEY label <<< "${MODELS[$selected]}"
echo ""
success "Selected: $PRICING_KEY"
write_yaml "pricing_model" "$PRICING_KEY"

if [ "$PRICING_KEY" != "none" ]; then
  ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
  [ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a 2>/dev/null || true

  if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
    fail "STRIPE_SECRET_KEY not set. Run: just setup stripe first."
    write_state "pricing" "fail" "Stripe not configured"
    exit 1
  fi

  info "Running pricing agent prompts to scaffold billing code..."

  for prompt in "$(dirname "$0")"/prompts/*.md; do
    [ -f "$prompt" ] || continue
    info "Running: $(basename "$prompt")"
    run_agent "$prompt"
    echo ""
    if ! confirm "Agent output looks correct — continue?"; then
      fail "Pricing setup aborted. Review agent output and retry."
      exit 1
    fi
  done

  success "Pricing model '$PRICING_KEY' scaffolded."
else
  info "pricing_model: none. Billing UI hidden automatically."
fi

write_state "pricing" "ok" "$PRICING_KEY"
