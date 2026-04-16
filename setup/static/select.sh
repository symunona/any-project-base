#!/bin/bash
# setup/static/select.sh — choose static hosting provider
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

header "STATIC HOSTING"
info "Hosts: landing, client-portal, admin-portal."
echo ""

PROVIDERS=(
  "cloudflare|Cloudflare Pages   — free unlimited bandwidth, best CDN, own your DNS"
  "vercel|Vercel              — best DX, generous free tier, git push = deploy"
  "netlify|Netlify             — reliable, good free tier, slightly older DX"
)

selected=0
TOTAL=${#PROVIDERS[@]}

printf "  ${DIM}Select provider: ↑↓ move, ↵ select, s=skip${RESET}\n"
echo ""

while true; do
  for i in "${!PROVIDERS[@]}"; do
    IFS='|' read -r key label <<< "${PROVIDERS[$i]}"
    if [ "$i" -eq "$selected" ]; then
      printf "  ${CYAN}${ICON_CURSOR}${RESET}  %s\n" "$label"
    else
      printf "     ${DIM}%s${RESET}\n" "$label"
    fi
  done
  echo ""

  action=$(read_key)
  case $action in
    up)    [ "$selected" -gt 0 ] && selected=$((selected - 1)); tput cuu $((TOTAL + 2)) 2>/dev/null || true ;;
    down)  [ "$selected" -lt $((TOTAL - 1)) ] && selected=$((selected + 1)); tput cuu $((TOTAL + 2)) 2>/dev/null || true ;;
    enter) break ;;
    quit)
      skip "Skipping static hosting."
      write_state "static" "skipped" "user skipped"
      exit 0
      ;;
  esac
done

IFS='|' read -r PROVIDER_KEY label <<< "${PROVIDERS[$selected]}"
echo ""
success "Selected: $PROVIDER_KEY"
write_yaml "static_host" "$PROVIDER_KEY"

PROVIDER_SCRIPT="$SETUP_DIR/static/$PROVIDER_KEY/setup.sh"
if [ -f "$PROVIDER_SCRIPT" ]; then
  bash "$PROVIDER_SCRIPT"
else
  warn "Setup script not found: $PROVIDER_SCRIPT"
  write_state "static" "skipped" "setup script missing"
fi
