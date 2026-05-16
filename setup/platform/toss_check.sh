#!/bin/bash
# setup/platform/toss_check.sh
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

if [ -z "${TOSS_SECRET_KEY:-}" ]; then
  echo "SKIP missing TOSS_SECRET_KEY"
  exit 1
fi

ENCODED=$(echo -n "${TOSS_SECRET_KEY}:" | base64)
if ! curl -sf -H "Authorization: Basic $ENCODED" https://api.tosspayments.com/v1/transactions > /dev/null 2>&1; then
  echo "FAIL invalid or expired Toss key"
  exit 1
fi

echo "OK"
