#!/bin/bash
# setup/dev/service_localdev.sh — install the dev stack as a systemd service
#
# Use case: VPS or shared test environment where the stack should survive reboots
# and run without anyone being logged in.
#
# What the service manages:
#   - Supabase Docker stack (supabase start / supabase stop)
#   - Nginx serves built static files (set up separately via nginx_localdev.sh)
#
# What it does NOT manage (one-time setup):
#   - pnpm build (run: just deploy-local-service)
#   - Nginx config (run: just setup-nginx-localdev first, or it runs it for you)
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

CONFIG_FILE="$SETUP_DIR/dev/.localdev-config"
PROJECT=$(grep '^name:' "$ROOT_DIR/project.yaml" | awk '{print $2}')
SERVICE_NAME="${PROJECT}-dev"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
SUPABASE_BIN=$(which supabase 2>/dev/null || echo "$HOME/.local/bin/supabase")

header "SERVICE LOCAL DEV"
info "Installs '${SERVICE_NAME}' as a systemd service."
info "Supabase starts on boot. Nginx serves built static files."
echo ""

# ── Nginx config first ────────────────────────────────────────────────────────
if ! nginx -t 2>/dev/null | grep -q "${PROJECT}" && \
   ! [ -f "/etc/nginx/sites-enabled/${PROJECT}" ]; then
  info "Nginx not yet configured — running nginx setup first..."
  bash "$SETUP_DIR/dev/nginx_localdev.sh" service
else
  info "Nginx already configured for ${PROJECT}."
  # Update mode to service in the nginx config
  bash "$SETUP_DIR/dev/nginx_localdev.sh" service
fi

echo ""

# ── Build check ───────────────────────────────────────────────────────────────
for dir in client-portal admin-portal landing; do
  if [ ! -d "$ROOT_DIR/$dir/dist" ]; then
    warn "dist/ missing for $dir — run 'just deploy-local-service' after setup to build."
  fi
done

# ── systemd service file ──────────────────────────────────────────────────────
info "Installing systemd service: ${SERVICE_NAME}..."

sudo tee "$SERVICE_FILE" > /dev/null <<SERVICE
[Unit]
Description=${PROJECT} dev service (Supabase stack)
Documentation=file://${ROOT_DIR}/SETUP.md
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=${USER}
WorkingDirectory=${ROOT_DIR}
ExecStart=${SUPABASE_BIN} start
ExecStop=${SUPABASE_BIN} stop
StandardOutput=journal
StandardError=journal
TimeoutStartSec=180

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl start "$SERVICE_NAME" && success "Service '${SERVICE_NAME}' started"

# Enable linger so service survives logout (VPS use case)
loginctl enable-linger "$USER" 2>/dev/null && \
  success "loginctl linger enabled — service survives logout" || \
  warn "loginctl linger failed — service may stop on logout"

# ── Update state ──────────────────────────────────────────────────────────────
sed -i '/^SERVICE_NAME=/d' "$CONFIG_FILE" 2>/dev/null || true
echo "SERVICE_NAME=${SERVICE_NAME}" >> "$CONFIG_FILE"

echo ""
success "Service installed."
info "Manage with:"
arrow "sudo systemctl status  ${SERVICE_NAME}"
arrow "sudo systemctl stop    ${SERVICE_NAME}"
arrow "sudo systemctl restart ${SERVICE_NAME}"
echo ""
info "Deploy new builds:"
arrow "just deploy-local-service"
echo ""
info "Check Supabase logs:"
arrow "journalctl -u ${SERVICE_NAME} -f"
