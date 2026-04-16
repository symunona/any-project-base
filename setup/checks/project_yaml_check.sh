#!/bin/bash
# setup/checks/project_yaml_check.sh
# Verify project.yaml has required fields, valid enums, no secrets
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/yaml.sh"
export PROJECT_YAML="$ROOT_DIR/project.yaml"

FAIL=0

check_field() {
  local key=$1 required=${2:-yes}
  local val
  val=$(read_yaml "$key")
  if [ -z "$val" ]; then
    if [ "$required" = "yes" ]; then
      echo "FAIL project.yaml missing required field: $key"
      FAIL=1
    fi
  fi
}

check_enum() {
  local key=$1 valid_values=("${@:2}")
  local val
  val=$(read_yaml "$key")
  [ -z "$val" ] && return  # skip if not set
  local found=0
  for v in "${valid_values[@]}"; do
    [ "$val" = "$v" ] && found=1 && break
  done
  if [ "$found" -eq 0 ]; then
    echo "FAIL project.yaml invalid value for $key: '$val' (valid: ${valid_values[*]})"
    FAIL=1
  fi
}

check_no_secrets() {
  if grep -qiE '(sk_live|sk_test|whsec_|eyJ[A-Za-z0-9]|phc_|service_role)' "$ROOT_DIR/project.yaml" 2>/dev/null; then
    echo "FAIL project.yaml contains secrets! Move to .env.local"
    FAIL=1
  fi
}

check_field "name"
check_field "agent"
check_field "pricing_model" "no"
check_field "default_locale" "no"

check_enum "agent" "claude" "codex" "gemini" "aider" "copilot" "echo"
check_enum "pricing_model" "none" "credits" "subscription" "credits+subscription"
check_enum "analytics" "none" "posthog"

check_no_secrets

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
