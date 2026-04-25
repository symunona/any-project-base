#!/bin/bash
# setup/dev/deploy_local_service.sh — build all apps and reload the local service
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

CONFIG_FILE="$SETUP_DIR/dev/.localdev-config"
PROJECT=$(grep '^name:' "$ROOT_DIR/project.yaml" | awk '{print $2}')
SERVICE_NAME=$(grep "^SERVICE_NAME=" "$CONFIG_FILE" 2>/dev/null | cut -d= -f2 || echo "${PROJECT}-dev")

header "DEPLOY LOCAL SERVICE"

# ── Sanity checks ─────────────────────────────────────────────────────────────
if [ ! -f "$CONFIG_FILE" ]; then
  fail "No local service configured. Run: just setup-service-localdev"
  exit 1
fi

if ! systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
  warn "Service '${SERVICE_NAME}' is not running."
  info "Starting it now..."
  sudo systemctl start "$SERVICE_NAME" || { fail "Failed to start service."; exit 1; }
fi

# ── Build ─────────────────────────────────────────────────────────────────────
info "Building all frontend apps..."
cd "$ROOT_DIR"
pnpm -r build && success "Build complete"

# ── Reload nginx ──────────────────────────────────────────────────────────────
info "Reloading Nginx..."
sudo nginx -s reload && success "Nginx reloaded"

# ── Print URLs ────────────────────────────────────────────────────────────────
URL_LANDING=$(grep "^URL_LANDING=" "$CONFIG_FILE" | cut -d= -f2)
URL_PORTAL=$(grep "^URL_PORTAL="  "$CONFIG_FILE" | cut -d= -f2)
URL_ADMIN=$(grep "^URL_ADMIN="   "$CONFIG_FILE" | cut -d= -f2)

W1=14
W2=$(( ${#URL_PORTAL} + 2 ))
[ $W2 -lt 42 ] && W2=42
SEP1=$(printf '─%.0s' $(seq 1 $((W1 + 2))))
SEP2=$(printf '─%.0s' $(seq 1 $((W2 + 1))))

echo ""
printf "╭%s┬%s╮\n" "$SEP1" "$SEP2"
printf "│ %-${W1}s │ %-${W2}s│\n" "Landing"       "$URL_LANDING"
printf "│ %-${W1}s │ %-${W2}s│\n" "Client Portal" "$URL_PORTAL"
printf "│ %-${W1}s │ %-${W2}s│\n" "Admin Portal"  "$URL_ADMIN"
printf "╰%s┴%s╯\n" "$SEP1" "$SEP2"
