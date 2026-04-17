#!/bin/bash
# setup/checks/apptype_check.sh
# Verify typed API client wiring:
# 1. AppType exported from supabase/functions/api/index.ts
# 2. AppType imported in commons/api/client.ts
# 3. hc<AppType> used in client.ts (not bare hc())
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

FAIL=0

API_INDEX="$ROOT_DIR/supabase/functions/api/index.ts"
CLIENT="$ROOT_DIR/commons/api/client.ts"

if [ ! -f "$API_INDEX" ]; then
  echo "FAIL supabase/functions/api/index.ts not found"
  exit 1
fi

if [ ! -f "$CLIENT" ]; then
  echo "FAIL commons/api/client.ts not found"
  exit 1
fi

# 1. AppType exported
if ! grep -q 'export type AppType\|export { AppType' "$API_INDEX" 2>/dev/null; then
  echo "FAIL AppType not exported from supabase/functions/api/index.ts"
  FAIL=1
fi

# 2. AppType imported in client.ts
if ! grep -q 'AppType' "$CLIENT" 2>/dev/null; then
  echo "FAIL AppType not imported in commons/api/client.ts"
  FAIL=1
fi

# 3. Typed hc<AppType> call
if ! grep -qP 'hc\s*<\s*AppType\s*>' "$CLIENT" 2>/dev/null; then
  echo "FAIL commons/api/client.ts not using hc<AppType> (untyped client)"
  FAIL=1
fi

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
