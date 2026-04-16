#!/bin/bash
# setup/checks/mobile_check.sh
# Check: no native imports outside src/platform/, expo web export succeeds
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOBILE_DIR="$ROOT_DIR/mobile-app"

if [ ! -d "$MOBILE_DIR" ]; then
  echo "SKIP mobile-app not present"
  exit 1
fi

FAIL=0

# No native module imports outside src/platform/
NATIVE_MODULES=(
  "expo-notifications"
  "expo-task-manager"
  "expo-local-authentication"
  "expo-linking"
  "expo-camera"
)

for mod in "${NATIVE_MODULES[@]}"; do
  while IFS= read -r -d '' file; do
    case "$file" in
      */src/platform/*|*/node_modules/*) continue ;;
    esac
    if grep -q "from '$mod'" "$file" 2>/dev/null || grep -q "require('$mod')" "$file" 2>/dev/null; then
      echo "FAIL native import '$mod' outside src/platform/: $file"
      FAIL=1
    fi
  done < <(find "$MOBILE_DIR" -type f -name "*.ts" -o -name "*.tsx" -print0)
done

# Every platform file has web stub
for platform_file in "$MOBILE_DIR/src/platform/"*.ts; do
  [ -f "$platform_file" ] || continue
  if ! grep -q "Platform.OS.*web\|web.*stub\|webStub" "$platform_file"; then
    echo "WARN $platform_file may be missing web stub"
  fi
done

# expo export --platform web
info "Running expo export --platform web..."
if ! (cd "$MOBILE_DIR" && npx expo export --platform web > /dev/null 2>&1); then
  echo "FAIL expo export --platform web failed (native leak or build error)"
  FAIL=1
fi

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
