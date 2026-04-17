#!/bin/bash
# setup/checks/tsc_check.sh
# Run tsc --noEmit on all packages that have a tsconfig.json.
# Requires: node_modules installed (pnpm install).
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if ! command -v tsc > /dev/null 2>&1 && ! [ -f "$ROOT_DIR/node_modules/.bin/tsc" ]; then
  echo "SKIP tsc not found — run pnpm install first"
  exit 1
fi

TSC="${ROOT_DIR}/node_modules/.bin/tsc"
[ -f "$TSC" ] || TSC="tsc"

FAIL=0
PACKAGES=(commons client-portal admin-portal mobile-app)

for pkg in "${PACKAGES[@]}"; do
  dir="$ROOT_DIR/$pkg"
  [ -f "$dir/tsconfig.json" ] || continue
  [ -d "$dir/node_modules" ] || { echo "SKIP $pkg — node_modules missing (run pnpm install)"; continue; }

  OUTPUT=$(cd "$dir" && "$TSC" --noEmit 2>&1 || true)
  if [ -n "$OUTPUT" ]; then
    echo "FAIL tsc errors in $pkg:"
    echo "$OUTPUT" | head -20
    FAIL=1
  else
    echo "OK $pkg"
  fi
done

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK all packages"
