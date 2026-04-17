#!/bin/bash
# setup/checks/env_parity_check.sh
# Two-way check:
# 1. Every VITE_* in .env.local.example must be referenced somewhere in source.
# 2. Every import.meta.env.VITE_* in source must be declared in .env.local.example.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

EXAMPLE="$ROOT_DIR/.env.local.example"
if [ ! -f "$EXAMPLE" ]; then
  echo "SKIP .env.local.example not found"
  exit 1
fi

FAIL=0

# 1. Vars declared in example but never used in source
while IFS= read -r line; do
  [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
  KEY=$(echo "$line" | cut -d= -f1)
  [[ "$KEY" != VITE_* ]] && continue

  if ! grep -rq "$KEY" \
    "$ROOT_DIR/commons" "$ROOT_DIR/client-portal" "$ROOT_DIR/admin-portal" \
    "$ROOT_DIR/landing" "$ROOT_DIR/mobile-app" \
    --include="*.ts" --include="*.tsx" --include="*.js" \
    --exclude-dir=node_modules 2>/dev/null; then
    echo "WARN phantom var in .env.local.example (not used in source): $KEY"
    # WARN not FAIL — example may contain optional vars
  fi
done < "$EXAMPLE"

# 2. Vars used in source but not declared in example
while IFS= read -r key; do
  [ -z "$key" ] && continue
  if ! grep -q "^${key}=" "$EXAMPLE" 2>/dev/null && ! grep -q "^${key} " "$EXAMPLE" 2>/dev/null; then
    echo "FAIL undeclared env var used in source but missing from .env.local.example: $key"
    FAIL=1
  fi
done < <(grep -roh 'import\.meta\.env\.\(VITE_[A-Z0-9_]\+\)' \
  "$ROOT_DIR/commons" "$ROOT_DIR/client-portal" "$ROOT_DIR/admin-portal" \
  "$ROOT_DIR/landing" "$ROOT_DIR/mobile-app" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules 2>/dev/null \
  | grep -oP 'VITE_[A-Z0-9_]+' | sort -u || true)

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
