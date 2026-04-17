#!/bin/bash
# setup/checks/billing_guard_check.sh
# Verify billing UI is properly gated on pricingModel.
# BillingPage (web) and billing.tsx (mobile) must return null when pricingModel === 'none'.
# AppLayout must hide billing nav when pricingModel === 'none'.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

FAIL=0

check_guard() {
  local file=$1 pattern=$2 desc=$3
  if [ ! -f "$file" ]; then
    echo "WARN file not found: $file"
    return
  fi
  if ! grep -qP "$pattern" "$file" 2>/dev/null; then
    echo "FAIL $desc missing pricingModel guard: $file"
    FAIL=1
  fi
}

# client-portal BillingPage
check_guard \
  "$ROOT_DIR/client-portal/src/pages/settings/BillingPage.tsx" \
  "pricingModel.*none.*null|null.*pricingModel.*none" \
  "BillingPage.tsx"

# admin-portal PlansPage
check_guard \
  "$ROOT_DIR/admin-portal/src/pages/PlansPage.tsx" \
  "pricingModel.*none.*null|null.*pricingModel.*none" \
  "PlansPage.tsx"

# mobile billing.tsx
check_guard \
  "$ROOT_DIR/mobile-app/app/(app)/billing.tsx" \
  "pricingModel.*none|pricing.*none" \
  "mobile billing.tsx"

# client-portal AppLayout hides billing nav
LAYOUT="$ROOT_DIR/client-portal/src/layouts/AppLayout.tsx"
if [ -f "$LAYOUT" ]; then
  if ! grep -qP 'pricingModel|pricing_model' "$LAYOUT" 2>/dev/null; then
    echo "FAIL client-portal AppLayout.tsx does not gate billing nav on pricingModel"
    FAIL=1
  fi
fi

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
