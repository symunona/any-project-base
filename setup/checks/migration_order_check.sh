#!/bin/bash
# setup/checks/migration_order_check.sh
# Migrations must have monotonically increasing timestamps.
# No duplicate timestamps. Filenames must match expected pattern.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "SKIP supabase/migrations not found"
  exit 1
fi

FAIL=0
prev_ts=0
prev_file=""

while IFS= read -r f; do
  fname=$(basename "$f")

  # Must start with a 14-digit timestamp
  if ! echo "$fname" | grep -qP '^\d{14}_'; then
    echo "FAIL bad migration filename (expected YYYYMMDDHHMMSS_name.sql): $fname"
    FAIL=1
    continue
  fi

  ts=$(echo "$fname" | grep -oP '^\d{14}')

  if [ "$ts" -le "$prev_ts" ] && [ "$prev_ts" -ne 0 ]; then
    echo "FAIL out-of-order or duplicate timestamp: $fname (after $prev_file)"
    FAIL=1
  fi

  prev_ts="$ts"
  prev_file="$fname"
done < <(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort)

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
