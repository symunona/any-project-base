#!/bin/bash
# setup/checks/schema_drift_check.sh
# Verify frontend Zod schemas in commons match backend _shared/schemas.ts
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

COMMONS_SCHEMAS="$ROOT_DIR/commons/schemas"
BACKEND_SCHEMAS="$ROOT_DIR/supabase/functions/_shared/schemas.ts"

if [ ! -f "$BACKEND_SCHEMAS" ]; then
  echo "SKIP backend schemas file not found"
  exit 1
fi

FAIL=0

# Check each schema in commons against backend
for schema_file in "$COMMONS_SCHEMAS"/*.ts; do
  [ -f "$schema_file" ] || continue
  SCHEMA_NAME=$(basename "$schema_file" .ts)

  # Extract Zod shape keys from both files
  COMMONS_KEYS=$(grep -oP '(?<=z\.object\(\{)[^}]+' "$schema_file" | grep -oP '\w+(?=:)' | sort 2>/dev/null || echo "")
  BACKEND_KEYS=$(grep -oP "(?<=z\.object\(\{)[^}]+" "$BACKEND_SCHEMAS" | grep -oP '\w+(?=:)' | sort 2>/dev/null || echo "")

  if [ -z "$COMMONS_KEYS" ] || [ -z "$BACKEND_KEYS" ]; then
    continue
  fi

  MISSING=$(comm -23 <(echo "$COMMONS_KEYS") <(echo "$BACKEND_KEYS"))
  if [ -n "$MISSING" ]; then
    echo "FAIL schema drift in $SCHEMA_NAME — commons has fields missing in backend: $MISSING"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 1 ]; then
  exit 1
fi

echo "OK"
