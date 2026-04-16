#!/bin/bash
# setup/install.sh — main orchestrator
# First run: sequential steps. Re-run: interactive menu.

set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

STATE_FILE="$SETUP_DIR/.install-state.json"

STEPS=(
  "agent|Agent selector|$SETUP_DIR/init/agent.sh|no"
  "project|Project init|$SETUP_DIR/init/project.sh|no"
  "branding|Branding|$SETUP_DIR/branding/branding.sh|yes"
  "dns|DNS setup|$SETUP_DIR/platform/dns_setup.sh|yes"
  "static|Static hosting|$SETUP_DIR/static/select.sh|yes"
  "mobile|Mobile setup|$SETUP_DIR/mobile/setup.sh|yes"
  "tooling|Dev tooling|$SETUP_DIR/dev/tooling_setup.sh|no"
  "supabase|Supabase cloud|$SETUP_DIR/platform/supabase_setup.sh|yes"
  "stripe|Stripe|$SETUP_DIR/platform/stripe_setup.sh|yes"
  "firebase|Firebase|$SETUP_DIR/platform/firebase_setup.sh|yes"
  "posthog|PostHog|$SETUP_DIR/platform/posthog_setup.sh|yes"
  "env|Env validation|$SETUP_DIR/env/env_check.sh|no"
  "pricing|Pricing model|$SETUP_DIR/pricing/setup_pricing.sh|no"
)

TOTAL=${#STEPS[@]}

print_step_list() {
  local current_key=$1
  local current_num=0
  for i in "${!STEPS[@]}"; do
    IFS='|' read -r key name script skippable <<< "${STEPS[$i]}"
    local step_status
    step_status=$(read_state "$key" status 2>/dev/null || echo "")
    local num=$((i + 1))
    if [ "$key" = "$current_key" ]; then
      printf "  ${CYAN}${ICON_CURSOR}${RESET}  ${BOLD}%2d. %s${RESET}\n" "$num" "$name"
    elif [ "$step_status" = "ok" ]; then
      printf "  ${GREEN}${ICON_OK}${RESET}   ${DIM}%2d. %s${RESET}\n" "$num" "$name"
    elif [ "$step_status" = "skipped" ]; then
      printf "  ${YELLOW}${ICON_SKIP}${RESET}   ${DIM}%2d. %s  (skipped)${RESET}\n" "$num" "$name"
    else
      printf "  ${DIM}    %2d. %s${RESET}\n" "$num" "$name"
    fi
  done
}

run_step() {
  local key=$1 name=$2 script=$3
  if [ -f "$script" ]; then
    bash "$script"
  else
    warn "Script not found: $script"
    warn "Skipping $name."
    write_state "$key" "skipped" "script not found"
  fi
}

# ── First run (no state file) → sequential
if [ ! -f "$STATE_FILE" ]; then
  header "ANY PROJECT BASE SETUP"
  info "First-time setup. Running all steps in sequence."
  info "Press s to skip a step, q to quit at any prompt."
  echo ""

  for i in "${!STEPS[@]}"; do
    IFS='|' read -r key name script skippable <<< "${STEPS[$i]}"
    num=$((i + 1))
    echo ""
    divider
    printf "  ${BOLD}Step %s of %s${RESET} — ${BOLD}${CYAN}%s${RESET}\n" "$num" "$TOTAL" "$name"
    print_step_list "$key"
    divider
    echo ""

    if [ "$skippable" = "yes" ]; then
      if ! confirm "Run: $name? (s to skip)"; then
        skip "Skipping $name."
        write_state "$key" "skipped" "user skipped"
        continue
      fi
    fi

    run_step "$key" "$name" "$script"
  done

  # Generate INSTALL_STATUS.md
  bash "$SETUP_DIR/env/env_check.sh" --report || true
  header "SETUP COMPLETE"
  success "All steps finished. See INSTALL_STATUS.md for a summary."
  info "Run 'just setup health' to check platform status."
  info "Run 'just dev' to start local development."
  exit 0
fi

# ── Re-run → interactive menu
header "SETUP MENU"
printf "  ${DIM}↑↓ navigate, ↵ run, q quit${RESET}\n"
echo ""

selected=0
while true; do
  # Redraw menu
  tput cup 4 0 2>/dev/null || true
  for i in "${!STEPS[@]}"; do
    IFS='|' read -r key name script skippable <<< "${STEPS[$i]}"
    local_status=$(read_state "$key" status 2>/dev/null || echo "")
    local_note=$(read_state "$key" note 2>/dev/null || echo "")
    if [ "$i" -eq "$selected" ]; then
      prefix="${CYAN}${ICON_CURSOR}${RESET}"
    else
      prefix=" "
    fi
    case $local_status in
      ok)      icon="${GREEN}${ICON_OK}${RESET}" ;;
      skipped) icon="${YELLOW}${ICON_SKIP}${RESET}" ;;
      fail)    icon="${RED}${ICON_FAIL}${RESET}" ;;
      *)       icon=" " ;;
    esac
    printf "  %b %b  %-25s %s\n" "$prefix" "$icon" "$name" "${DIM}${local_note}${RESET}"
  done
  echo ""
  divider

  action=$(read_key)
  case $action in
    up)    [ "$selected" -gt 0 ] && selected=$((selected - 1)) ;;
    down)  [ "$selected" -lt $((TOTAL - 1)) ] && selected=$((selected + 1)) ;;
    enter)
      IFS='|' read -r key name script skippable <<< "${STEPS[$selected]}"
      clear
      header "$name"
      run_step "$key" "$name" "$script"
      header "SETUP MENU"
      printf "  ${DIM}↑↓ navigate, ↵ run, q quit${RESET}\n"
      echo ""
      ;;
    quit) echo ""; info "Exiting setup."; exit 0 ;;
  esac
done
