#!/bin/bash
# setup/lib/ui.sh — source this in every setup script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# Icons
ICON_OK="✓"
ICON_FAIL="✗"
ICON_WARN="⚠"
ICON_ARROW="→"
ICON_SKIP="↷"
ICON_INFO="•"
ICON_WAIT="…"
ICON_CURSOR="▶"

WIDTH=50  # divider width

divider() { printf '━%.0s' $(seq 1 $WIDTH); printf '\n'; }

header() {
  echo ""
  divider
  printf "  ${BOLD}${CYAN}%s${RESET}\n" "$1"
  divider
  echo ""
}

step() {
  local num=$1 name=$2 total=$3
  local filled=$(( num * 10 / total ))
  local empty=$(( 10 - filled ))
  local bar=""
  for ((i=0; i<filled; i++)); do bar+="█"; done
  for ((i=0; i<empty; i++)); do bar+="░"; done

  echo ""
  divider
  printf "  ${DIM}[${bar}]${RESET} ${BOLD}Step %s of %s${RESET} — ${BOLD}${CYAN}%s${RESET}\n" \
    "$num" "$total" "$name"
  divider
  echo ""
}

info()    { printf "  ${ICON_INFO}  %s\n" "$1"; }
warn()    { printf "  ${YELLOW}${ICON_WARN}  %s${RESET}\n" "$1"; }
success() { printf "  ${GREEN}${ICON_OK}  %s${RESET}\n" "$1"; }
fail()    { printf "  ${RED}${ICON_FAIL}  %s${RESET}\n" "$1"; }
arrow()   { printf "  ${CYAN}${ICON_ARROW}${RESET}  %s\n" "$1"; }
skip()    { printf "  ${YELLOW}${ICON_SKIP}  %s${RESET}\n" "$1"; }

prompt_input() {
  local label=$1 varname=$2
  printf "  ${YELLOW}%s${RESET} ${DIM}(s=skip, q=quit)${RESET}: " "$label"
  read -r input
  if [[ "$input" == "s" ]]; then return 1; fi
  if [[ "$input" == "q" ]]; then echo ""; info "Quitting setup."; exit 0; fi
  eval "$varname='$input'"
  return 0
}

confirm() {
  printf "  ${YELLOW}%s${RESET} ${DIM}[y/N]${RESET}: " "$1"
  read -r ans
  [[ "$ans" =~ ^[Yy]$ ]]
}

status_row() {
  local name=$1 status=$2 note=$3
  local icon
  case $status in
    ok)      icon="${GREEN}${ICON_OK} ${RESET}" ;;
    skipped) icon="${YELLOW}${ICON_SKIP}${RESET}" ;;
    fail)    icon="${RED}${ICON_FAIL}${RESET}" ;;
    *)       icon="  " ;;
  esac
  printf "  %b  %-22s %b\n" "$icon" "$name" "${DIM}${note}${RESET}"
}

read_key() {
  read -s -n1 key
  if [[ $key == $'\x1b' ]]; then
    read -s -n2 key
    case $key in
      '[A') echo "up" ;;
      '[B') echo "down" ;;
    esac
  elif [[ $key == "" ]]; then echo "enter"
  elif [[ $key == "q" ]]; then echo "quit"
  fi
}

write_state() {
  local step=$1 status=$2 note=${3:-""}
  local state_file="$(dirname "$0")/../.install-state.json"
  if [ ! -f "$state_file" ]; then echo "{}" > "$state_file"; fi
  local tmp
  tmp=$(mktemp)
  python3 -c "
import json, sys
with open('$state_file') as f:
    d = json.load(f)
d['$step'] = {'status': '$status', 'note': '$note'}
print(json.dumps(d, indent=2))
" > "$tmp" && mv "$tmp" "$state_file"
}

read_state() {
  local step=$1 field=${2:-status}
  local state_file="$(dirname "$0")/../.install-state.json"
  if [ ! -f "$state_file" ]; then echo ""; return; fi
  python3 -c "
import json
with open('$state_file') as f:
    d = json.load(f)
entry = d.get('$step', {})
print(entry.get('$field', ''))
"
}
