#!/bin/bash
# setup/checks/generated_files_check.sh
# Verify all known GENERATED files have the correct header comment
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

GENERATED_FILES=(
  "commons/types/db.types.ts"
  "commons/styles/globals.css"
  "landing/styles/globals.css"
  "client-portal/public/manifest.json"
)

FAIL=0
for rel_path in "${GENERATED_FILES[@]}"; do
  file="$ROOT_DIR/$rel_path"
  if [ ! -f "$file" ]; then
    echo "WARN generated file not found: $rel_path"
    continue
  fi

  # Check for GENERATED header (first line or first 3 lines)
  if ! head -3 "$file" | grep -q "GENERATED"; then
    echo "FAIL missing GENERATED header: $rel_path"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 1 ]; then
  exit 1
fi

echo "OK"
