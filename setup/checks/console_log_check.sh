#!/bin/bash
# setup/checks/console_log_check.sh
# console.log in committed source = noise in production.
# Allow: console.error (legitimate), console.warn (legitimate).
# Exempt: DevLogin, dev-login edge function, setup scripts.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

FAIL=0

while IFS= read -r hit; do
  [ -z "$hit" ] && continue
  file=$(echo "$hit" | cut -d: -f1)

  # Exemptions: dev-only components, edge functions (server-side logging OK), setup scripts
  case "$file" in
    *DevLogin*|*dev-login*|*setup/*|*/node_modules/*|*/.git/*) continue ;;
    */supabase/functions/*) continue ;;  # server-side: console.log goes to edge function logs
  esac

  echo "FAIL console.log found (remove or replace with errorMonitor.capture): $hit"
  FAIL=1
done < <(grep -rn 'console\.log\s*(' \
  "$ROOT_DIR/commons" "$ROOT_DIR/client-portal" "$ROOT_DIR/admin-portal" \
  "$ROOT_DIR/mobile-app" "$ROOT_DIR/supabase/functions" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules 2>/dev/null || true)

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
