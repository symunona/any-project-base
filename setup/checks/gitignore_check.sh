#!/bin/bash
# setup/checks/gitignore_check.sh
# .env.local must be gitignored. dist/ must be gitignored.
# No .env files (except .example) tracked in git index.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

FAIL=0

# Check root .gitignore covers critical paths
ROOT_GITIGNORE="$ROOT_DIR/.gitignore"
REQUIRED_IGNORES=(
  '.env.local'
  'node_modules'
  'dist'
  '.install-state.json'
)

for entry in "${REQUIRED_IGNORES[@]}"; do
  if ! grep -q "$entry" "$ROOT_GITIGNORE" 2>/dev/null; then
    echo "FAIL .gitignore missing entry: $entry"
    FAIL=1
  fi
done

# No .env files tracked in git (except .example and .env.test if committed intentionally)
if git rev-parse --git-dir > /dev/null 2>&1; then
  TRACKED_ENVS=$(git ls-files | grep -P '\.env($|\.[^e])' | grep -v '\.example' | grep -v '\.env\.test' || true)
  if [ -n "$TRACKED_ENVS" ]; then
    echo "FAIL .env file(s) tracked in git:"
    echo "$TRACKED_ENVS"
    FAIL=1
  fi

  # node_modules not tracked
  TRACKED_MODULES=$(git ls-files | grep 'node_modules/' | head -3 || true)
  if [ -n "$TRACKED_MODULES" ]; then
    echo "FAIL node_modules tracked in git"
    FAIL=1
  fi
fi

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
