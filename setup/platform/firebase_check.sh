#!/bin/bash
# setup/platform/firebase_check.sh
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

if [ -z "${FIREBASE_PROJECT_ID:-}" ]; then
  echo "SKIP missing FIREBASE_PROJECT_ID"
  exit 1
fi

if [ -z "${FIREBASE_SERVICE_ACCOUNT_PATH:-}" ] || [ ! -f "$FIREBASE_SERVICE_ACCOUNT_PATH" ]; then
  echo "FAIL service account JSON missing"
  exit 1
fi

echo "OK"
