#!/bin/bash
# setup/static/cloudflare/check.sh
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "SKIP missing CLOUDFLARE_API_TOKEN"
  exit 1
fi

if ! command -v wrangler > /dev/null 2>&1; then
  echo "FAIL wrangler CLI not installed"
  exit 1
fi

if ! curl -sf -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/user/tokens/verify" > /dev/null 2>&1; then
  echo "FAIL Cloudflare token invalid"
  exit 1
fi

echo "OK"
