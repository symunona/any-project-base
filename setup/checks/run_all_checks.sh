#!/bin/bash
# setup/checks/run_all_checks.sh — runs all code quality checks (used by just check)
# Also callable standalone: bash setup/checks/run_all_checks.sh
set -euo pipefail
CHECKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$(dirname "$CHECKS_DIR")/lib/ui.sh"

header "JUST CHECK"

CHECKS=(
  "generated_files_check.sh"
  "css_color_check.sh"
  "fetch_check.sh"
  "i18n_check.sh"
  "paging_check.sh"
  "schema_drift_check.sh"
  "branding_check.sh"
  "auth_check.sh"
  "project_yaml_check.sh"
  "mobile_check.sh"
  "complexity_check.sh"
  "commons_check.sh"
)

FAIL=0
for check in "${CHECKS[@]}"; do
  script="$CHECKS_DIR/$check"
  name="${check%.sh}"
  if [ ! -f "$script" ]; then
    warn "$name — script not found"
    continue
  fi

  RESULT=$(bash "$script" 2>&1 || true)
  STATUS=$(echo "$RESULT" | head -1 | cut -d' ' -f1)
  NOTE=$(echo "$RESULT" | head -1 | cut -d' ' -f2-)

  case $STATUS in
    OK)   status_row "$name" "ok" "$NOTE" ;;
    SKIP) status_row "$name" "skipped" "$NOTE" ;;
    FAIL) status_row "$name" "fail" "$NOTE"; FAIL=1 ;;
    WARN) status_row "$name" "skipped" "WARN: $NOTE" ;;
    *)    status_row "$name" "fail" "$RESULT"; FAIL=1 ;;
  esac
done

echo ""
if [ "$FAIL" -eq 1 ]; then
  fail "One or more checks failed."
  exit 1
fi
success "All checks passed."
