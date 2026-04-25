#!/bin/bash
# setup/dev/nginx_localdev.sh — Nginx reverse proxy for VPS/remote dev via nip.io
#
# Idempotent — safe to re-run. Preloads all previous values.
#
# WHY nip.io?  portal.1.2.3.4.nip.io resolves to 1.2.3.4 — free wildcard DNS,
#              no domain needed, works with any IP including Tailscale.
#
# HTTPS note:  Let's Encrypt HTTP-01 challenge requires port 80 to be publicly
#              reachable. Tailscale-only (private) setups won't work — LE servers
#              can't reach your machine. Use HTTP in that case, or open port 80.
#
# Exposed:     Frontend apps + Supabase API (Kong port 54321)
# NOT exposed: Supabase Studio (54323), raw DB (54322) — localhost only
#              Access Studio: ssh -L 54323:localhost:54323 <vps> → localhost:54323
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

CONFIG_FILE="$SETUP_DIR/dev/.localdev-config"
PROJECT=$(grep '^name:' "$ROOT_DIR/project.yaml" | awk '{print $2}')
MODE="${1:-dev}"  # dev | service

header "NGINX LOCAL DEV"
[ "$MODE" = "service" ] && info "Mode: service (serves built dist/)" \
                        || info "Mode: dev (proxies Vite dev servers)"
echo ""

# ── Load saved state ──────────────────────────────────────────────────────────
load_state() {
  local key=$1 default=${2:-}
  grep "^${key}=" "$CONFIG_FILE" 2>/dev/null | cut -d= -f2- || echo "$default"
}

SAVED_IP=$(load_state IP)
SAVED_EMAIL=$(load_state HTTPS_EMAIL)
SAVED_HTTPS=$(load_state HTTPS "no")

# ── Domain / IP ───────────────────────────────────────────────────────────────
DETECTED_IP=$(curl -4 -s --max-time 3 https://ifconfig.me 2>/dev/null || \
              ip addr show tailscale0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1 || \
              hostname -I | awk '{print $1}')

SAVED_DOMAIN=$(load_state CUSTOM_DOMAIN)
SAVED_IP=$(load_state IP)

info "Domain options:"
arrow "Custom domain  e.g. dev.myapp.com  — supports HTTPS via Let's Encrypt"
arrow "nip.io (auto)  e.g. ${DETECTED_IP}.nip.io — HTTP only (LE rate-limited on shared domain)"
echo ""
printf "  Custom base domain ${DIM}[${SAVED_DOMAIN:-leave blank for nip.io}]${RESET}: "
read -r INPUT_DOMAIN
CUSTOM_DOMAIN="${INPUT_DOMAIN:-$SAVED_DOMAIN}"

if [ -n "$CUSTOM_DOMAIN" ]; then
  BASE_DOMAIN="$CUSTOM_DOMAIN"
  IP="$DETECTED_IP"
  info "Using custom domain: ${BASE_DOMAIN}"
  info "DNS required: A records pointing to ${IP}"
  arrow "  ${BASE_DOMAIN}         →  ${IP}  (landing)"
  arrow "  portal.${BASE_DOMAIN}  →  ${IP}"
  arrow "  admin.${BASE_DOMAIN}   →  ${IP}"
  arrow "  api.${BASE_DOMAIN}     →  ${IP}"
  info "Or a single wildcard: *.${BASE_DOMAIN} + ${BASE_DOMAIN}  →  ${IP}"
  HTTPS_CAPABLE=true
else
  printf "  IP address ${DIM}[${SAVED_IP:-$DETECTED_IP}]${RESET}: "
  read -r INPUT_IP
  IP="${INPUT_IP:-${SAVED_IP:-$DETECTED_IP}}"
  BASE_DOMAIN="${IP}.nip.io"
  info "Using nip.io: ${BASE_DOMAIN} (HTTP only — nip.io hits LE rate limits)"
  HTTPS_CAPABLE=false
fi

DOMAIN_CHANGED=false
[ -n "$SAVED_DOMAIN" ] && [ "$SAVED_DOMAIN" != "$CUSTOM_DOMAIN" ] && DOMAIN_CHANGED=true
[ -z "$SAVED_DOMAIN" ] && [ -n "$SAVED_IP" ] && [ "$SAVED_IP" != "$IP" ] && DOMAIN_CHANGED=true

URL_LANDING="http://${BASE_DOMAIN}"
URL_PORTAL="http://portal.${BASE_DOMAIN}"
URL_ADMIN="http://admin.${BASE_DOMAIN}"
URL_API="http://api.${BASE_DOMAIN}"

# ── Status checks ─────────────────────────────────────────────────────────────
echo ""
info "Current status:"

NGINX_CONF="/etc/nginx/sites-available/${PROJECT}"
NGINX_LINK="/etc/nginx/sites-enabled/${PROJECT}"

if [ -f "$NGINX_LINK" ] || [ -L "$NGINX_LINK" ]; then
  success "Nginx config   installed ($NGINX_LINK)"
else
  warn "Nginx config   not installed"
fi

if systemctl is-active --quiet nginx 2>/dev/null; then
  success "Nginx          running"
else
  warn "Nginx          not running"
fi

CERT_PATH="/etc/letsencrypt/live/portal.${BASE_DOMAIN}"
CERT_STATUS="none"
if ! $HTTPS_CAPABLE; then
  warn "SSL cert       n/a (nip.io — use a custom domain for HTTPS)"
elif [ -f "${CERT_PATH}/cert.pem" ]; then
  EXPIRY=$(openssl x509 -enddate -noout -in "${CERT_PATH}/cert.pem" 2>/dev/null | cut -d= -f2 || echo "unknown")
  DAYS_LEFT=$(( ( $(date -d "$EXPIRY" +%s 2>/dev/null || echo 0) - $(date +%s) ) / 86400 ))
  if [ "${DAYS_LEFT:-0}" -gt 0 ] 2>/dev/null; then
    success "SSL cert       valid — expires ${EXPIRY} (${DAYS_LEFT} days)"
    CERT_STATUS="valid"
  else
    warn "SSL cert       EXPIRED — ${EXPIRY}"
    CERT_STATUS="expired"
  fi
  if $DOMAIN_CHANGED; then
    warn "Domain changed — existing cert is for old domain, HTTPS needs re-setup"
    CERT_STATUS="domain-changed"
  fi
else
  warn "SSL cert       not installed"
fi

echo ""

# ── Exposure warning ──────────────────────────────────────────────────────────
warn "INTERNET EXPOSURE"
info "Will be reachable from the network/internet:"
arrow "Frontend apps  (${MODE} mode)"
arrow "Supabase API   auth, database, edge functions, storage"
info "Supabase Studio and raw DB stay localhost-only."
echo ""

if ! confirm "Continue?"; then info "Aborted."; exit 0; fi
echo ""

# ── Generate Nginx config (HTTP) ──────────────────────────────────────────────
NGINX_CONF_TMP=$(mktemp)

cat > "$NGINX_CONF_TMP" <<NGINX
# Generated by setup/dev/nginx_localdev.sh (${MODE} mode)
# Re-run: just setup-nginx-localdev
# HTTPS managed by certbot — do not remove certbot comment blocks below

NGINX

write_block() {
  local subdomain=$1 port=$2 distdir=$3
  local server_name
  [ "$subdomain" = "root" ] && server_name="${BASE_DOMAIN}" \
                             || server_name="${subdomain}.${BASE_DOMAIN}"

  printf 'server {\n    listen 80;\n    server_name %s;\n\n' "$server_name" >> "$NGINX_CONF_TMP"

  if [ "$MODE" = "service" ]; then
    cat >> "$NGINX_CONF_TMP" <<BLOCK
    root ${ROOT_DIR}/${distdir}/dist;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

BLOCK
  else
    cat >> "$NGINX_CONF_TMP" <<BLOCK
    location / {
        proxy_pass http://localhost:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}

BLOCK
  fi
}

write_block "root"   5175 "landing"
write_block "portal" 5173 "client-portal"
write_block "admin"  5174 "admin-portal"

cat >> "$NGINX_CONF_TMP" <<NGINX
server {
    listen 80;
    server_name api.${BASE_DOMAIN};
    location / {
        proxy_pass http://localhost:54321;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX

info "Installing Nginx config..."
sudo cp "$NGINX_CONF_TMP" "$NGINX_CONF"
rm -f "$NGINX_CONF_TMP"
[ -L "$NGINX_LINK" ] || sudo ln -s "$NGINX_CONF" "$NGINX_LINK"
sudo nginx -t && sudo nginx -s reload && success "Nginx reloaded (HTTP)"

# ── HTTPS via Let's Encrypt ───────────────────────────────────────────────────
echo ""
info "HTTPS setup (Let's Encrypt)"

WANT_HTTPS=false
if ! $HTTPS_CAPABLE; then
  info "Skipping HTTPS — nip.io hits Let's Encrypt rate limits (shared registered domain)."
  info "To enable HTTPS: re-run with a custom domain (e.g. dev.myapp.com)."
else
  if ! command -v certbot > /dev/null 2>&1; then
    warn "certbot not installed."
    if confirm "Install certbot now?"; then
      sudo apt-get install -y certbot python3-certbot-nginx && success "certbot installed"
    else
      info "Skipping HTTPS. Re-run this script anytime to add it."
    fi
  fi

  if command -v certbot > /dev/null 2>&1; then
    if [ "$CERT_STATUS" = "valid" ] && ! $DOMAIN_CHANGED; then
      info "Valid cert already installed."
      if confirm "Re-run certbot anyway (renew / update nginx config)?"; then
        WANT_HTTPS=true
      fi
    elif [ "$CERT_STATUS" = "domain-changed" ]; then
      warn "Domain changed — new cert required."
      WANT_HTTPS=true
    else
      if confirm "Set up HTTPS with Let's Encrypt? (requires port 80 publicly reachable)"; then
        WANT_HTTPS=true
      fi
    fi
  fi
fi

if $WANT_HTTPS; then
  # Email for Let's Encrypt notifications
  SUGGEST_EMAIL="${SAVED_EMAIL:-}"
  printf "  Email for Let's Encrypt notifications${SUGGEST_EMAIL:+ ${DIM}[${SUGGEST_EMAIL}]${RESET}}: "
  read -r INPUT_EMAIL
  EMAIL="${INPUT_EMAIL:-$SUGGEST_EMAIL}"

  if [ -z "$EMAIL" ]; then
    fail "Email required for Let's Encrypt."; WANT_HTTPS=false
  else
    ALL_DOMAINS="${BASE_DOMAIN},portal.${BASE_DOMAIN},admin.${BASE_DOMAIN},api.${BASE_DOMAIN}"
    info "Running certbot for: $ALL_DOMAINS"
    if sudo certbot --nginx \
        --non-interactive \
        --agree-tos \
        --keep-until-expiring \
        --redirect \
        --email "$EMAIL" \
        --domains "$ALL_DOMAINS" 2>&1; then
      success "HTTPS enabled — certbot updated Nginx config"
      # Update URLs to https://
      URL_LANDING="https://${BASE_DOMAIN}"
      URL_PORTAL="https://portal.${BASE_DOMAIN}"
      URL_ADMIN="https://admin.${BASE_DOMAIN}"
      URL_API="https://api.${BASE_DOMAIN}"
      SAVED_HTTPS="yes"
      SAVED_EMAIL="$EMAIL"
    else
      warn "certbot failed. Staying on HTTP."
      warn "Common cause: port 80 not reachable from the internet (Tailscale-only setup)."
      WANT_HTTPS=false
    fi
  fi
fi

[ "$WANT_HTTPS" = "false" ] && SAVED_HTTPS="no"

# ── Update .env.local ─────────────────────────────────────────────────────────
info "Updating .env.local..."
set_env_force() {
  local key=$1 value=$2 file="$ROOT_DIR/.env.local"
  [ -f "$file" ] || cp "$ROOT_DIR/.env.local.example" "$file"
  sed -i "/^${key}=/d" "$file"
  echo "${key}=${value}" >> "$file"
  success "$key → $value"
}
set_env_force "SITE_URL"          "$URL_PORTAL"
set_env_force "VITE_APP_URL"      "$URL_PORTAL"
set_env_force "VITE_SUPABASE_URL" "$URL_API"
set_env_force "VITE_API_URL"      "${URL_API}/functions/v1"

# ── Save state ────────────────────────────────────────────────────────────────
mkdir -p "$(dirname "$CONFIG_FILE")"
cat > "$CONFIG_FILE" <<STATE
MODE=${MODE}
IP=${IP}
CUSTOM_DOMAIN=${CUSTOM_DOMAIN:-}
BASE_DOMAIN=${BASE_DOMAIN}
HTTPS=${SAVED_HTTPS}
HTTPS_EMAIL=${SAVED_EMAIL:-}
URL_LANDING=${URL_LANDING}
URL_PORTAL=${URL_PORTAL}
URL_ADMIN=${URL_ADMIN}
URL_API=${URL_API}
STATE
success "State saved → setup/dev/.localdev-config"

# ── Print URL table ───────────────────────────────────────────────────────────
W1=14
W2=$(( ${#URL_API} + 2 ))
[ $W2 -lt 44 ] && W2=44
SEP1=$(printf '─%.0s' $(seq 1 $((W1 + 2))))
SEP2=$(printf '─%.0s' $(seq 1 $((W2 + 1))))

echo ""
printf "╭%s┬%s╮\n" "$SEP1" "$SEP2"
printf "│ %-${W1}s │ %-${W2}s│\n" "Landing"       "$URL_LANDING"
printf "│ %-${W1}s │ %-${W2}s│\n" "Client Portal" "$URL_PORTAL"
printf "│ %-${W1}s │ %-${W2}s│\n" "Admin Portal"  "$URL_ADMIN"
printf "│ %-${W1}s │ %-${W2}s│\n" "Supabase API"  "$URL_API"
printf "╰%s┴%s╯\n" "$SEP1" "$SEP2"
echo ""
printf "  ${DIM}Studio: ssh -L 54323:localhost:54323 <vps> → http://localhost:54323${RESET}\n"

# ── Tailscale info ────────────────────────────────────────────────────────────
TS_IP=$(ip addr show tailscale0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1 || true)
if [ -n "$TS_IP" ]; then
  TS_HOST=$(tailscale status 2>/dev/null | grep -E "^\s*${TS_IP}" | awk '{print $2}' || true)
  [ -z "$TS_HOST" ] && TS_HOST=$(hostname)
  echo ""
  printf "  ${BOLD}Tailscale${RESET}  ${TS_IP}${TS_HOST:+ (${TS_HOST})}\n"
  printf "  ${DIM}Tailnet members reach the URLs above via this IP.${RESET}\n"
  if [ "$SAVED_HTTPS" != "yes" ]; then
    printf "  ${DIM}HTTPS not set up — LE requires public port 80. Tailscale-only = HTTP only.${RESET}\n"
  fi
fi

if [ "$MODE" = "dev" ]; then
  echo ""
  info "Start your dev servers:"
  arrow "just kill && just start"
fi
