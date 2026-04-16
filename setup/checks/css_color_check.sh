#!/bin/bash
# setup/checks/css_color_check.sh
# Fail if any hardcoded hex/rgb/hsl color found outside globals.css and colors.yaml
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

VIOLATIONS=()

while IFS= read -r -d '' file; do
  # Skip generated/excluded files
  case "$file" in
    */globals.css|*/colors.yaml|*/palette.js|*/palette-template.html|*/node_modules/*|*/.git/*) continue ;;
  esac

  # Check for hardcoded brand colors in CSS files.
  # Allow: #fff #000 #ffffff #000000 and rgba/rgb with only 0 or 255 channels
  # (structural overlay colors — not brand colors).
  if [[ "$file" == *.css ]]; then
    HITS=$(grep -nP '(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\()' "$file" 2>/dev/null \
      | grep -vP '#(fff|000|ffffff|000000)\b' \
      | grep -vP 'rgba?\(\s*(0|255)\s*,\s*(0|255)\s*,\s*(0|255)' \
      || true)
    if [ -n "$HITS" ]; then
      echo "$HITS"
      VIOLATIONS+=("$file")
    fi
  fi
done < <(find "$ROOT_DIR" -type f \( -name "*.css" \) -print0)

if [ ${#VIOLATIONS[@]} -gt 0 ]; then
  echo "FAIL hardcoded colors in CSS (use var(--color-*)):"
  printf "  %s\n" "${VIOLATIONS[@]}"
  exit 1
fi

echo "OK"
