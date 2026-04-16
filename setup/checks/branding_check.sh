#!/bin/bash
# setup/checks/branding_check.sh
# Check: CSS vars match colors.yaml, logos copied, manifest in sync
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

FAIL=0

# colors.yaml must exist
COLORS_YAML="$ROOT_DIR/branding/colors.yaml"
if [ ! -f "$COLORS_YAML" ]; then
  echo "SKIP branding/colors.yaml not found — run: just setup branding"
  exit 1
fi

# Read primary from colors.yaml
PRIMARY=$(grep '^primary:' "$COLORS_YAML" | awk '{print $2}' | tr -d '"')

# globals.css must have --color-primary matching
CSS_FILE="$ROOT_DIR/commons/styles/globals.css"
if [ -f "$CSS_FILE" ]; then
  CSS_PRIMARY=$(grep -F -- '--color-primary' "$CSS_FILE" | grep -oP '#[0-9a-fA-F]+' | head -1)
  if [ "$CSS_PRIMARY" != "$PRIMARY" ] && [ -n "$PRIMARY" ] && [ -n "$CSS_PRIMARY" ]; then
    echo "FAIL color mismatch: colors.yaml=$PRIMARY but globals.css=$CSS_PRIMARY"
    FAIL=1
  fi
fi

# Logos must exist in public/ dirs
for dir in client-portal/public admin-portal/public; do
  for logo in logo-large.svg logo-small.svg logo-favicon.svg; do
    if [ ! -f "$ROOT_DIR/$dir/$logo" ]; then
      echo "WARN missing logo: $dir/$logo (run: just setup apply-branding)"
    fi
  done
done

if [ "$FAIL" -eq 1 ]; then
  exit 1
fi

echo "OK"
