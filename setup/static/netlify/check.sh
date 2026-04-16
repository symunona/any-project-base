#!/bin/bash
# setup/static/netlify/check.sh
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
  echo "SKIP missing NETLIFY_AUTH_TOKEN"
  exit 1
fi

if ! command -v netlify > /dev/null 2>&1; then
  echo "FAIL netlify CLI not installed (npm install -g netlify-cli)"
  exit 1
fi

if ! curl -sf -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    "https://api.netlify.com/api/v1/user" > /dev/null 2>&1; then
  echo "FAIL Netlify token invalid"
  exit 1
fi

echo "OK"
