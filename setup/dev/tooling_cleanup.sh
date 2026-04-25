#!/bin/bash
# setup/dev/tooling_cleanup.sh — remove only tools this project installed
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

STATE_FILE="$SETUP_DIR/.tooling-state"

header "CLEANUP ENV"

if [ ! -f "$STATE_FILE" ]; then
  warn "No install state found ($STATE_FILE)."
  info "Nothing to clean up — tooling_setup.sh was never run, or state was deleted."
  exit 0
fi

echo ""
info "Checking install state..."
echo ""

# Parse state file and show what will/won't be removed
TO_REMOVE=()
while IFS='=' read -r key value; do
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  if [ "$value" = "pre-existing" ]; then
    printf "  ${DIM}skip  %-12s — was already installed before this project${RESET}\n" "$key"
  else
    printf "  ${YELLOW}remove%-12s — installed by this project (%s)${RESET}\n" " $key" "$value"
    TO_REMOVE+=("$key:$value")
  fi
done < "$STATE_FILE"

echo ""

if [ ${#TO_REMOVE[@]} -eq 0 ]; then
  info "Nothing to remove — all tools were pre-existing."
  exit 0
fi

echo ""
printf "  ${BOLD}${RED}Type 'yes' to remove the tools listed above: ${RESET}"
read -r confirm
if [ "$confirm" != "yes" ]; then
  info "Aborted."
  exit 0
fi

echo ""

for entry in "${TO_REMOVE[@]}"; do
  key="${entry%%:*}"
  method="${entry#*:}"

  case "$key" in
    pnpm)
      info "Removing pnpm..."
      npm uninstall -g pnpm && success "pnpm removed" || warn "pnpm removal failed"
      ;;
    supabase)
      info "Removing supabase CLI..."
      # We always install to ~/.local/bin
      rm -f "$HOME/.local/bin/supabase" && success "supabase removed from ~/.local/bin" || warn "supabase removal failed"
      ;;
    caddy)
      info "Removing caddy (installed via: $method)..."
      caddy stop 2>/dev/null || true
      case "$method" in
        brew)         brew uninstall caddy && success "caddy removed via brew" || warn "failed" ;;
        snap)         sudo snap remove caddy && success "caddy removed via snap" || warn "failed" ;;
        linux-binary) rm -f "$HOME/.local/bin/caddy" && success "caddy removed from ~/.local/bin" || warn "failed" ;;
        *)            warn "Unknown install method '$method' — remove caddy manually" ;;
      esac
      ;;
    just)
      info "Removing just (installed via: $method)..."
      case "$method" in
        snap)  sudo snap remove just && success "just removed via snap" || warn "failed" ;;
        brew)  brew uninstall just && success "just removed via brew" || warn "failed" ;;
        cargo) cargo uninstall just && success "just removed via cargo" || warn "failed" ;;
        *)     warn "Unknown install method '$method' — remove just manually" ;;
      esac
      ;;
    *)
      warn "Unknown tool '$key' in state file — skipping"
      ;;
  esac
done

rm -f "$STATE_FILE"
echo ""
success "Cleanup done. State file removed."
info "Note: Docker and Node.js are never auto-removed (too risky — system-wide deps)."
