#!/bin/bash
# setup/checks/api_url_check.sh
# VITE_API_URL must be set and end with /api.
# If the URL is reachable, verifies the endpoint is live (not "Function not found").
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ENV_FILE="$ROOT_DIR/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  echo "SKIP .env.local not found"
  exit 0
fi

API_URL=$(grep '^VITE_API_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

if [ -z "$API_URL" ]; then
  echo "FAIL VITE_API_URL not set in .env.local"
  exit 1
fi

if [[ "$API_URL" != */api ]]; then
  echo "FAIL VITE_API_URL must end with /api — got: \"$API_URL\""
  exit 1
fi

# Live smoke test — only if URL is absolute and reachable
if [[ "$API_URL" == http* ]]; then
  RESPONSE=$(curl -sf --max-time 3 "${API_URL}/users" 2>/dev/null || true)
  if [ -n "$RESPONSE" ]; then
    if echo "$RESPONSE" | grep -q "Function not found"; then
      echo "FAIL ${API_URL}/users → \"Function not found\" — wrong function path in VITE_API_URL"
      exit 1
    fi
    if ! echo "$RESPONSE" | grep -q '"data"'; then
      echo "FAIL ${API_URL}/users returned unexpected response: ${RESPONSE:0:120}"
      exit 1
    fi
  fi
fi

echo "OK"
