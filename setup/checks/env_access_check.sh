#!/bin/bash
# setup/checks/env_access_check.sh
# import.meta.env.VITE_* must only appear in commons/config.ts.
# process.env must not appear in frontend code (Vite/Expo projects).
# Deno.env.get() allowed only in supabase/functions/.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

FAIL=0

# import.meta.env outside commons/config.ts
while IFS= read -r hit; do
  [ -z "$hit" ] && continue
  file=$(echo "$hit" | cut -d: -f1)
  [[ "$file" == *"commons/config.ts"* ]] && continue
  [[ "$file" == *"vite.config"* ]] && continue       # vite.config reads env for build-time injection
  [[ "$file" == *"node_modules"* ]] && continue
  echo "FAIL import.meta.env outside commons/config.ts: $hit"
  FAIL=1
done < <(grep -rn 'import\.meta\.env\.' \
  "$ROOT_DIR/commons" "$ROOT_DIR/client-portal" "$ROOT_DIR/admin-portal" \
  "$ROOT_DIR/landing" "$ROOT_DIR/mobile-app" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules 2>/dev/null || true)

# process.env in frontend code (should use import.meta.env via config.ts)
for dir in commons client-portal admin-portal landing; do
  [ -d "$ROOT_DIR/$dir" ] || continue
  HITS=$(grep -rn 'process\.env' "$ROOT_DIR/$dir" \
    --include="*.ts" --include="*.tsx" \
    --exclude-dir=node_modules 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    echo "FAIL process.env in frontend code (use config.ts):"
    echo "$HITS"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
