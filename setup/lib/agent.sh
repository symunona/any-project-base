#!/bin/bash
# setup/lib/agent.sh — run_agent() helper

SCRIPT_DIR_AGENT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_YAML="${PROJECT_YAML:-$SCRIPT_DIR_AGENT/../../project.yaml}"

AGENT_CMD=$(grep '^agent:' "$PROJECT_YAML" 2>/dev/null | awk '{print $2}')
AGENT_FLAGS=$(grep '^agent_flags:' "$PROJECT_YAML" 2>/dev/null | sed 's/agent_flags: //' | tr -d '"')

AGENT_CMD=${AGENT_CMD:-echo}

run_agent() {
  local prompt_file=$1
  if [ ! -f "$prompt_file" ]; then
    echo "ERROR: prompt file not found: $prompt_file"
    exit 1
  fi

  if [ "$AGENT_CMD" = "echo" ]; then
    echo "--- DRY RUN: would call agent with ---"
    cat "$prompt_file"
    echo "--------------------------------------"
    return 0
  fi

  # shellcheck disable=SC2086
  $AGENT_CMD $AGENT_FLAGS -p "$(cat "$prompt_file")"
}
