#!/bin/bash
# setup/dev/caddy_start.sh — generate Caddyfile from project.yaml and start/reload Caddy
#
# WHY subdomains instead of ports?
#   • Realistic URLs that match your prod domain structure (admin.myapp.com → admin.myapp.localhost)
#   • Cookie isolation — each subdomain has its own cookie jar, so auth sessions don't bleed
#     between portal and admin during testing (they would on the same origin with different ports)
#   • CORS behaves correctly — same as prod, so you catch CORS bugs locally
#   • Readable — http://admin.myapp.localhost beats http://localhost:6174 for sharing with teammates
#
# WHY port 80?
#   Without it, every URL needs ":2015" or similar — ugly and easy to forget.
#   Port 80 requires elevated permissions (kernel restriction for ports < 1024).
#   Linux: one-time `setcap` during `just install` — Caddy can bind port 80 forever after, no sudo.
#   macOS: no setcap equivalent. `sudo caddy start` daemonizes Caddy — sudo prompt once per reboot.
#
# WHY *.localhost resolves without /etc/hosts?
#   RFC 6761 designates .localhost as a special-use domain that resolves to 127.0.0.1.
#   Chrome and Firefox implement this directly in the browser — no OS DNS lookup needed.
#   (Safari on macOS uses the system resolver, which does not implement RFC 6761 for subdomains.)

set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

if ! caddy version > /dev/null 2>&1; then
  fail "caddy not found — run: just install"
  exit 1
fi

PROJECT_NAME=$(grep '^name:' "$ROOT_DIR/project.yaml" | awk '{print $2}')
BASE="${PROJECT_NAME}.localhost"

# ── Generate Caddyfile ────────────────────────────────────────────────────────
cat > "$ROOT_DIR/Caddyfile" <<EOF
# Generated from project.yaml — do not edit manually.
# Re-generated on every: just start | just setup-caddy
{
  admin localhost:2019
  auto_https off
}

# Landing
${BASE} {
  reverse_proxy localhost:6175
}

# Client portal
portal.${BASE} {
  reverse_proxy localhost:6173
}

# Admin portal
admin.${BASE} {
  reverse_proxy localhost:6174
}
EOF

info "Caddyfile generated for ${BASE}"

# ── Start or reload Caddy ─────────────────────────────────────────────────────
if curl -sf http://localhost:2019/config/ > /dev/null 2>&1; then
  info "Caddy already running — reloading config..."
  caddy reload --config "$ROOT_DIR/Caddyfile" && success "Caddy reloaded"
else
  OS="$(uname -s)"
  if [ "$OS" = "Darwin" ]; then
    warn "macOS: Caddy needs your password to bind port 80 (once per reboot — it stays as a daemon)."
    sudo caddy start --config "$ROOT_DIR/Caddyfile" && success "Caddy started"
  else
    caddy start --config "$ROOT_DIR/Caddyfile" && success "Caddy started"
  fi
fi

URL_LANDING="http://${BASE}"
URL_PORTAL="http://portal.${BASE}"
URL_ADMIN="http://admin.${BASE}"

# Dynamic column widths
W1=14  # "Client Portal"
W2=$(( ${#URL_ADMIN} + 2 ))
[ $W2 -lt 38 ] && W2=38
SEP1=$(printf '─%.0s' $(seq 1 $((W1 + 2))))
SEP2=$(printf '─%.0s' $(seq 1 $((W2 + 1))))

echo ""
printf "╭%s┬%s╮\n" "$SEP1" "$SEP2"
printf "│ %-${W1}s │ %-${W2}s│\n" "Landing"       "$URL_LANDING"
printf "│ %-${W1}s │ %-${W2}s│\n" "Client Portal" "$URL_PORTAL"
printf "│ %-${W1}s │ %-${W2}s│\n" "Admin Portal"  "$URL_ADMIN"
printf "╰%s┴%s╯\n" "$SEP1" "$SEP2"
echo ""
printf "  ${DIM}Chrome / Firefox — *.localhost resolves via RFC 6761, no /etc/hosts needed${RESET}\n"
printf "  ${DIM}Safari on macOS uses system resolver and won't resolve *.localhost subdomains${RESET}\n"
