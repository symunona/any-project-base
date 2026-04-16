#!/bin/bash
# setup/init/agent.sh — step 1: agent selector
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

header "AGENT SELECTOR"
info "Which AI coding agent will you use with this project?"
info "Choice is saved to project.yaml. Change later: just setup agent"
echo ""

AGENTS=(
  "claude|Claude Code CLI (Anthropic — recommended)|claude --model claude-sonnet-4-6"
  "codex|OpenAI Codex CLI|codex"
  "gemini|Google Gemini CLI|gemini"
  "aider|Aider (open source, multi-model)|aider"
  "copilot|GitHub Copilot CLI|gh copilot suggest"
  "echo|Dry run — prints prompts only (no agent call)|echo"
)

selected=0
TOTAL_AGENTS=${#AGENTS[@]}

while true; do
  for i in "${!AGENTS[@]}"; do
    IFS='|' read -r key label flags <<< "${AGENTS[$i]}"
    if [ "$i" -eq "$selected" ]; then
      printf "  ${CYAN}${ICON_CURSOR}${RESET}  ${BOLD}%s${RESET}  ${DIM}%s${RESET}\n" "$key" "$label"
    else
      printf "       ${DIM}%s${RESET}\n" "$key"
    fi
  done
  echo ""
  printf "  ${DIM}↑↓ navigate, ↵ select, q=quit${RESET}"

  action=$(read_key)
  case $action in
    up)    [ "$selected" -gt 0 ] && selected=$((selected - 1)); tput cuu $((TOTAL_AGENTS + 2)) 2>/dev/null || true ;;
    down)  [ "$selected" -lt $((TOTAL_AGENTS - 1)) ] && selected=$((selected + 1)); tput cuu $((TOTAL_AGENTS + 2)) 2>/dev/null || true ;;
    enter) break ;;
    quit)  info "Quitting."; exit 0 ;;
  esac
done

IFS='|' read -r key label flags <<< "${AGENTS[$selected]}"
echo ""
success "Selected: $key"

write_yaml "agent" "$key"
write_yaml "agent_flags" "\"$flags\""

write_state "agent" "ok" "$key"
