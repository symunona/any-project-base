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

  # Check for hardcoded colors in CSS files
  if [[ "$file" == *.css ]]; then
    if grep -nP '(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\()' "$file" 2>/dev/null; then
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
