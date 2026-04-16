#!/bin/bash
# setup/pricing/check_pricing.sh
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/yaml.sh"

PRICING=$(read_yaml "pricing_model")

if [ "$PRICING" = "none" ] || [ -z "$PRICING" ]; then
  echo "OK billing disabled (none)"
  exit 0
fi

ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a 2>/dev/null || true

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "FAIL pricing_model=$PRICING but STRIPE_SECRET_KEY missing"
  exit 1
fi

echo "OK $PRICING"
