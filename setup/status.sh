#!/bin/bash
# setup/status.sh — aggregate status: platforms + env vars
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

check_platform() {
  local name=$1 script=$2
  local output
  output=$(bash "$SETUP_DIR/platform/$script" 2>&1)
  local code=$?
  if [ $code -eq 0 ]; then
    status_row "$name" ok ""
  elif echo "$output" | grep -q "^SKIP"; then
    status_row "$name" skipped "${output#SKIP }"
  else
    status_row "$name" fail "${output#FAIL }"
  fi
}

header "PROJECT STATUS"

printf "  ${BOLD}Platforms${RESET}\n\n"
check_platform "Supabase"  supabase_check.sh
check_platform "Stripe"    stripe_check.sh
check_platform "Firebase"  firebase_check.sh
check_platform "PostHog"   posthog_check.sh
check_platform "DNS"       dns_check.sh

echo ""
printf "  ${BOLD}Env vars${RESET}\n\n"

EXAMPLE_FILE="$ROOT_DIR/.env.local.example"
ENV_FILE="$ROOT_DIR/.env.local"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a 2>/dev/null || true

MISSING=()
PRESENT=()
while IFS= read -r line; do
  [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
  KEY=$(echo "$line" | cut -d= -f1)
  if [ -z "${!KEY:-}" ]; then MISSING+=("$KEY"); else PRESENT+=("$KEY"); fi
done < "$EXAMPLE_FILE"

if [ ${#MISSING[@]} -eq 0 ]; then
  success "${#PRESENT[@]} vars present"
else
  info "${#PRESENT[@]} present, ${#MISSING[@]} missing"
  for k in "${MISSING[@]}"; do warn "missing: $k"; done
  echo ""
  arrow "run: just setup-env"
fi

echo ""
