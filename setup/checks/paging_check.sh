#!/bin/bash
# setup/checks/paging_check.sh
# Verify all list endpoints return PagedResponse envelope {data, total, limit, offset, hasMore}
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ROUTES_FILE="$ROOT_DIR/supabase/functions/api/index.ts"
if [ ! -f "$ROUTES_FILE" ]; then
  echo "SKIP API routes file not found"
  exit 1
fi

# Find list route handlers (GET routes that return arrays)
FAIL=0
for routes_file in "$ROOT_DIR"/supabase/functions/api/routes/*.ts; do
  [ -f "$routes_file" ] || continue

  # If file has a GET handler that returns an array, it must use PagedResponse shape
  if grep -q "\.get(" "$routes_file" && ! grep -q "hasMore" "$routes_file"; then
    # Only warn if it looks like a list (has array return or data: [...])
    if grep -qP "data:\s*\[" "$routes_file"; then
      echo "FAIL $(basename "$routes_file"): GET list missing hasMore/PagedResponse envelope"
      FAIL=1
    fi
  fi
done

if [ "$FAIL" -eq 1 ]; then
  exit 1
fi

echo "OK"
