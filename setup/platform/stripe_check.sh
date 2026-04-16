#!/bin/bash
# setup/platform/stripe_check.sh
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "SKIP missing STRIPE_SECRET_KEY"
  exit 1
fi

if ! curl -sf -u "$STRIPE_SECRET_KEY:" https://api.stripe.com/v1/account > /dev/null 2>&1; then
  echo "FAIL invalid or expired Stripe key"
  exit 1
fi

echo "OK"
