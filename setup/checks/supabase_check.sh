#!/bin/bash
# setup/checks/supabase_check.sh — full Supabase health check
# Delegates to platform check + additional code checks
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAIL=0

# Platform connectivity
bash "$SETUP_DIR/platform/supabase_check.sh" || FAIL=1

# All migrations exist
ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"
MIGRATION_DIR="$ROOT_DIR/supabase/migrations"
EXPECTED_MIGRATIONS=(
  "_init"
  "_devices"
  "_support"
  "_usage"
  "_deployments"
  "_magic_links"
  "_email_templates"
  "_credits"
)

for suffix in "${EXPECTED_MIGRATIONS[@]}"; do
  if ! ls "$MIGRATION_DIR"/*"$suffix.sql" > /dev/null 2>&1; then
    echo "WARN migration missing: *$suffix.sql"
  fi
done

# RLS check: every table in public schema has RLS enabled (via migration comment)
for migration in "$MIGRATION_DIR"/*.sql; do
  if grep -q "CREATE TABLE" "$migration"; then
    if ! grep -q "ENABLE ROW LEVEL SECURITY\|enable row level security" "$migration"; then
      TABLE=$(grep -oP '(?<=CREATE TABLE )\w+\.\w+|\w+' "$migration" | head -1)
      echo "WARN migration may be missing RLS: $(basename $migration) ($TABLE)"
    fi
  fi
done

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
