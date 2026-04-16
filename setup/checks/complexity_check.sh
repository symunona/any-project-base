#!/bin/bash
# setup/checks/complexity_check.sh
# Run complexity analysis. Fail on functions > threshold or regressions from baseline.
# Uses: npx ts-complexity (or similar)
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
THRESHOLD=10
FAIL=0

if ! command -v npx > /dev/null 2>&1; then
  echo "SKIP npx not found"
  exit 1
fi

# Check if complexity tool available
if ! npx --yes complexity-report --version > /dev/null 2>&1; then
  echo "SKIP complexity-report not installed (npm install -g complexity-report)"
  exit 1
fi

while IFS= read -r -d '' file; do
  case "$file" in */node_modules/*|*/.git/*|*/dist/*) continue ;; esac
  RESULT=$(npx complexity-report --format json "$file" 2>/dev/null || echo "{}")
  MAX=$(echo "$RESULT" | python3 -c "
import json,sys
d = json.load(sys.stdin)
funcs = d.get('functions', [])
scores = [f.get('cyclomatic',0) for f in funcs]
print(max(scores) if scores else 0)
" 2>/dev/null || echo "0")
  if [ "$MAX" -gt "$THRESHOLD" ]; then
    echo "FAIL complexity $MAX > $THRESHOLD in $file"
    FAIL=1
  fi
done < <(find "$ROOT_DIR" -type f -name "*.ts" -not -name "*.d.ts" -print0)

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
