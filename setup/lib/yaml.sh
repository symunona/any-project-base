#!/bin/bash
# setup/lib/yaml.sh — read_yaml() helper

SCRIPT_DIR_YAML="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_YAML="${PROJECT_YAML:-$SCRIPT_DIR_YAML/../../project.yaml}"

read_yaml() {
  local key=$1
  if [ ! -f "$PROJECT_YAML" ]; then
    echo ""
    return
  fi
  grep "^${key}:" "$PROJECT_YAML" | head -1 | sed "s/^${key}:[[:space:]]*//" | tr -d '"' | tr -d "'"
}

write_yaml() {
  local key=$1 value=$2
  if [ ! -f "$PROJECT_YAML" ]; then touch "$PROJECT_YAML"; fi
  if grep -q "^${key}:" "$PROJECT_YAML"; then
    sed -i "s|^${key}:.*|${key}: ${value}|" "$PROJECT_YAML"
  else
    echo "${key}: ${value}" >> "$PROJECT_YAML"
  fi
}
