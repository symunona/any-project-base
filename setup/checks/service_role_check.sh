#!/bin/bash
# setup/checks/service_role_check.sh
# Service role key must never appear in frontend code.
# Only allowed in: supabase/functions/ and setup/
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

FAIL=0

PATTERNS=(
  'SUPABASE_SERVICE_ROLE_KEY'
  'service_role'
)

FORBIDDEN_DIRS=(
  commons
  client-portal
  admin-portal
  landing
  mobile-app
)

for dir in "${FORBIDDEN_DIRS[@]}"; do
  [ -d "$ROOT_DIR/$dir" ] || continue
  for pattern in "${PATTERNS[@]}"; do
    HITS=$(grep -rn "$pattern" "$ROOT_DIR/$dir" \
      --include="*.ts" --include="*.tsx" --include="*.js" \
      --exclude-dir=node_modules 2>/dev/null || true)
    if [ -n "$HITS" ]; then
      echo "FAIL '$pattern' found in $dir (service role key must stay in supabase/functions/):"
      echo "$HITS"
      FAIL=1
    fi
  done
done

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
