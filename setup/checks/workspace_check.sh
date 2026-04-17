#!/bin/bash
# setup/checks/workspace_check.sh
# Every package dir with a package.json must be listed in pnpm-workspace.yaml.
# Every entry in pnpm-workspace.yaml must resolve to a real directory.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

WORKSPACE="$ROOT_DIR/pnpm-workspace.yaml"
if [ ! -f "$WORKSPACE" ]; then
  echo "SKIP pnpm-workspace.yaml not found"
  exit 1
fi

FAIL=0

# Packages that should be in the workspace
EXPECTED_PACKAGES=(commons client-portal admin-portal landing mobile-app)

for pkg in "${EXPECTED_PACKAGES[@]}"; do
  if [ ! -f "$ROOT_DIR/$pkg/package.json" ]; then
    echo "WARN $pkg/package.json not found"
    continue
  fi
  if ! grep -q "$pkg" "$WORKSPACE" 2>/dev/null; then
    echo "FAIL $pkg has package.json but is not listed in pnpm-workspace.yaml"
    FAIL=1
  fi
done

# Every entry in workspace file must resolve
while IFS= read -r entry; do
  [[ "$entry" =~ ^#.*$ || -z "$entry" ]] && continue
  entry=$(echo "$entry" | sed "s/^[[:space:]]*-[[:space:]]*//" | tr -d '"' | tr -d "'")
  [ -z "$entry" ] && continue
  # Handle glob patterns — just check the base dir exists
  basedir=$(echo "$entry" | cut -d'/' -f1 | tr -d '*')
  if [ -n "$basedir" ] && [ ! -d "$ROOT_DIR/$basedir" ]; then
    echo "FAIL pnpm-workspace.yaml entry doesn't resolve: $entry"
    FAIL=1
  fi
done < <(grep '^\s*-' "$WORKSPACE" 2>/dev/null || true)

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
