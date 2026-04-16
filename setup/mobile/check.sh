#!/bin/bash
# setup/mobile/check.sh — verify mobile dev environment
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

FAIL=()

# expo CLI
npx expo --version > /dev/null 2>&1 || FAIL+=("expo CLI missing")

# Android SDK
if [ -z "${ANDROID_HOME:-}" ] || [ ! -f "${ANDROID_HOME}/platform-tools/adb" ]; then
  FAIL+=("ANDROID_HOME not set or adb missing")
fi

# adb in PATH
command -v adb > /dev/null 2>&1 || FAIL+=("adb not in PATH")

# expo web export (no native leaks)
ROOT="$(cd "$SETUP_DIR/.." && pwd)"
if [ -d "$ROOT/mobile-app" ]; then
  if ! (cd "$ROOT/mobile-app" && npx expo export --platform web > /dev/null 2>&1); then
    FAIL+=("expo export --platform web failed (native leak?)")
  fi
fi

if [ ${#FAIL[@]} -gt 0 ]; then
  echo "FAIL ${FAIL[*]}"
  exit 1
fi

echo "OK"
