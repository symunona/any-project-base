#!/bin/bash
# setup/checks/rls_check.sh
# Every CREATE TABLE in migrations must have ENABLE ROW LEVEL SECURITY.
# Also checks: no DISABLE ROW LEVEL SECURITY, no FOR ALL on sensitive tables.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "SKIP supabase/migrations not found"
  exit 1
fi

FAIL=0

for f in "$MIGRATIONS_DIR"/*.sql; do
  [ -f "$f" ] || continue
  fname=$(basename "$f")

  # Count CREATE TABLE vs ENABLE ROW LEVEL SECURITY
  tables=$(grep -iP 'CREATE TABLE\s+(?:IF NOT EXISTS\s+)?' "$f" 2>/dev/null | wc -l | tr -d '[:space:]')
  rls=$(grep -i 'ENABLE ROW LEVEL SECURITY' "$f" 2>/dev/null | wc -l | tr -d '[:space:]')
  tables=${tables:-0}
  rls=${rls:-0}

  if [ "$tables" -gt 0 ] && [ "$rls" -lt "$tables" ]; then
    echo "FAIL $fname: $tables table(s) but only $rls ENABLE ROW LEVEL SECURITY"
    FAIL=1
  fi

  # No DISABLE ROW LEVEL SECURITY anywhere
  if grep -qi 'DISABLE ROW LEVEL SECURITY' "$f" 2>/dev/null; then
    echo "FAIL $fname: contains DISABLE ROW LEVEL SECURITY"
    FAIL=1
  fi

  # No USING (true) insert policy on credits or usage (would allow free credits)
  if grep -qi 'credits\|usage' "$f" 2>/dev/null; then
    if grep -P 'FOR INSERT|FOR ALL' "$f" 2>/dev/null | grep -qi 'USING (true)\|TO authenticated'; then
      echo "FAIL $fname: permissive insert policy on credits/usage table"
      FAIL=1
    fi
  fi
done

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
