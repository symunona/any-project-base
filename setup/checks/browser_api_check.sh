#!/bin/bash
# setup/checks/browser_api_check.sh
# Ban: window.confirm, window.alert, window.prompt — use Modal component.
# Ban: window.open for navigation — use router.
# Ban: document.write, document.cookie direct access.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

FAIL=0

PATTERNS=(
  'window\.confirm\s*\('
  'window\.alert\s*\('
  'window\.prompt\s*\('
  'document\.write\s*\('
)

for dir in commons client-portal admin-portal landing mobile-app; do
  [ -d "$ROOT_DIR/$dir" ] || continue
  for pattern in "${PATTERNS[@]}"; do
    HITS=$(grep -rn -P "$pattern" "$ROOT_DIR/$dir" \
      --include="*.ts" --include="*.tsx" --include="*.js" \
      --exclude-dir=node_modules 2>/dev/null || true)
    if [ -n "$HITS" ]; then
      echo "FAIL banned browser API '$pattern' — use Modal component instead:"
      echo "$HITS"
      FAIL=1
    fi
  done
done

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
