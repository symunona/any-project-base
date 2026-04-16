#!/bin/bash
# setup/checks/fetch_check.sh
# Fail if raw fetch() calls found outside fetchApi.ts, supabase.ts, and edge functions
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

VIOLATIONS=()

while IFS= read -r -d '' file; do
  case "$file" in
    */fetchApi.ts|*/supabase.ts|*/supabase/functions/*|*/node_modules/*|*/.git/*) continue ;;
  esac

  # Match: fetch( or await fetch( — not fetchApi(
  if grep -nP '\bfetch\s*\(' "$file" 2>/dev/null | grep -v 'fetchApi'; then
    VIOLATIONS+=("$file")
  fi
done < <(find "$ROOT_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0)

if [ ${#VIOLATIONS[@]} -gt 0 ]; then
  echo "FAIL raw fetch() calls found (use fetchApi from commons):"
  printf "  %s\n" "${VIOLATIONS[@]}"
  exit 1
fi

echo "OK"
