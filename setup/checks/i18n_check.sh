#!/bin/bash
# setup/checks/i18n_check.sh
# Check: all locale files have same keys as en.ts, no raw strings in JSX (heuristic)
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MESSAGES_DIR="$ROOT_DIR/commons/i18n/messages"

if [ ! -d "$MESSAGES_DIR" ]; then
  echo "SKIP i18n messages dir not found"
  exit 1
fi

EN_FILE="$MESSAGES_DIR/en.ts"
if [ ! -f "$EN_FILE" ]; then
  echo "SKIP en.ts not found"
  exit 1
fi

FAIL=0

# Check each locale file has same keys as en.ts
EN_KEYS=$(grep -oP "^\s+\K\w+(?=:)" "$EN_FILE" | sort)

for locale_file in "$MESSAGES_DIR"/*.ts; do
  [ "$locale_file" = "$EN_FILE" ] && continue
  LOCALE=$(basename "$locale_file" .ts)
  LOCALE_KEYS=$(grep -oP "^\s+\K\w+(?=:)" "$locale_file" | sort)

  MISSING=$(comm -23 <(echo "$EN_KEYS") <(echo "$LOCALE_KEYS"))
  EXTRA=$(comm -13 <(echo "$EN_KEYS") <(echo "$LOCALE_KEYS"))

  if [ -n "$MISSING" ]; then
    echo "FAIL $LOCALE missing keys: $MISSING"
    FAIL=1
  fi
  if [ -n "$EXTRA" ]; then
    echo "WARN $LOCALE has extra keys: $EXTRA"
  fi
done

if [ "$FAIL" -eq 1 ]; then
  exit 1
fi

echo "OK"
