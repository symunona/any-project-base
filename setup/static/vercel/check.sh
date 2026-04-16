#!/bin/bash
# setup/static/vercel/check.sh
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "SKIP missing VERCEL_TOKEN"
  exit 1
fi

if ! command -v vercel > /dev/null 2>&1; then
  echo "FAIL vercel CLI not installed (npm install -g vercel)"
  exit 1
fi

if ! curl -sf -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v2/user" > /dev/null 2>&1; then
  echo "FAIL Vercel token invalid"
  exit 1
fi

echo "OK"
