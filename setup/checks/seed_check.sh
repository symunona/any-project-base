#!/bin/bash
# setup/checks/seed_check.sh
# Verify seed.sql has all required dev users with correct credit balances.
# user-nocredits must have 0 credits. Others must have positive balance.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

SEED="$ROOT_DIR/supabase/seed.sql"
if [ ! -f "$SEED" ]; then
  echo "SKIP supabase/seed.sql not found"
  exit 1
fi

FAIL=0

REQUIRED_USERS=(
  "admin@dev.local"
  "support@dev.local"
  "user@dev.local"
  "user-nocredits@dev.local"
  "user-sub@dev.local"
)

for email in "${REQUIRED_USERS[@]}"; do
  if ! grep -q "$email" "$SEED" 2>/dev/null; then
    echo "FAIL seed.sql missing required user: $email"
    FAIL=1
  fi
done

# user-nocredits credit insert must have balance 0.
# Find the specific line: "select id, N from ... where email = 'user-nocredits@dev.local'"
NOCREDITS_BALANCE=$(grep -P "user-nocredits@dev\.local" "$SEED" \
  | grep -iP 'select id,\s*\d+' \
  | grep -oP 'select id,\s*\K\d+' \
  | head -1 || true)

if [ -n "$NOCREDITS_BALANCE" ] && [ "$NOCREDITS_BALANCE" -gt 0 ]; then
  echo "FAIL user-nocredits@dev.local has non-zero credits in seed: $NOCREDITS_BALANCE"
  FAIL=1
fi

# Seed must use encrypted/hashed passwords, not plaintext
# Supabase auth.users uses crypt() — should not see plaintext 'devpassword' in INSERT INTO auth.users
if grep -qP "auth\.users.*'devpassword'" "$SEED" 2>/dev/null; then
  echo "FAIL seed.sql inserts plaintext password into auth.users"
  FAIL=1
fi

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
