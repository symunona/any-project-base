#!/bin/bash
# setup/checks/commons_check.sh
# Check: fetch guard, color guard, no circular deps
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FAIL=0

# Re-run fetch_check and css_color_check
bash "$(dirname "$0")/fetch_check.sh" || FAIL=1
bash "$(dirname "$0")/css_color_check.sh" || FAIL=1

# Check commons exports don't import from portals (no circular)
while IFS= read -r -d '' file; do
  if grep -qP "from '(client-portal|admin-portal|landing|mobile-app)" "$file" 2>/dev/null; then
    echo "FAIL commons imports from portal: $file"
    FAIL=1
  fi
done < <(find "$ROOT_DIR/commons" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0)

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
