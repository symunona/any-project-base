#!/bin/bash
# setup/checks/sdk_imports_check.sh
# Third-party analytics/monitoring/payment SDKs must only be imported inside commons/lib/.
# App code must use the wrappers, never the SDK directly.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

FAIL=0

# SDK → allowed path
declare -A SDK_RULES
SDK_RULES['posthog-js']='commons/lib/analytics'
SDK_RULES['@sentry/']='commons/lib/errorMonitor'
SDK_RULES['stripe']='commons/lib/'
SDK_RULES['@anthropic-ai/sdk']='commons/lib/llm'
SDK_RULES['firebase/']='commons/lib/'
SDK_RULES['expo-notifications']='mobile-app/src/platform/'
SDK_RULES['expo-task-manager']='mobile-app/src/platform/'
SDK_RULES['expo-local-authentication']='mobile-app/src/platform/'
SDK_RULES['expo-camera']='mobile-app/src/platform/'

SEARCH_DIRS=(commons client-portal admin-portal landing mobile-app)

for sdk in "${!SDK_RULES[@]}"; do
  allowed="${SDK_RULES[$sdk]}"
  for dir in "${SEARCH_DIRS[@]}"; do
    [ -d "$ROOT_DIR/$dir" ] || continue
    while IFS= read -r hit; do
      [ -z "$hit" ] && continue
      file=$(echo "$hit" | cut -d: -f1)
      # Allow if file is inside the allowed path
      if [[ "$file" != *"$allowed"* ]]; then
        echo "FAIL direct SDK import '$sdk' outside allowed path ($allowed):"
        echo "  $hit"
        FAIL=1
      fi
    done < <(grep -rn "from '${sdk}" "$ROOT_DIR/$dir" \
      --include="*.ts" --include="*.tsx" \
      --exclude-dir=node_modules 2>/dev/null || true)
  done
done

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
