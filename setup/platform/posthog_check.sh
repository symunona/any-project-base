#!/bin/bash
# setup/platform/posthog_check.sh
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

if [ -z "${VITE_POSTHOG_KEY:-}" ]; then
  echo "SKIP missing VITE_POSTHOG_KEY"
  exit 1
fi

if ! curl -sf -H "Authorization: Bearer $VITE_POSTHOG_KEY" "https://app.posthog.com/api/projects/" > /dev/null 2>&1; then
  echo "FAIL PostHog key invalid or expired"
  exit 1
fi

echo "OK"
