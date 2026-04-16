#!/bin/bash
# setup/static/cloudflare/setup.sh — Cloudflare Pages setup
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

header "CLOUDFLARE PAGES SETUP"
info "Hosts landing, client-portal, admin-portal on Cloudflare CDN."
info "Free unlimited bandwidth. Owns your DNS too."
echo ""

arrow "Go to https://dash.cloudflare.com → right sidebar → Account ID → copy"
echo ""

prompt_input "Paste Cloudflare Account ID" CF_ACCOUNT_ID || {
  skip "Skipping Cloudflare."; write_state "static" "skipped" "user skipped"; exit 0
}

arrow "My Profile → API Tokens → Create Token → Edit Cloudflare Workers template"
arrow "Scope: Account → Cloudflare Pages → Edit"
echo ""

prompt_input "Paste Cloudflare API Token" CF_API_TOKEN || {
  skip "Skipping Cloudflare."; write_state "static" "skipped" "user skipped"; exit 0
}

# Validate
if ! curl -sf -H "Authorization: Bearer $CF_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID" > /dev/null 2>&1; then
  fail "Cloudflare API rejected credentials."
  write_state "static" "fail" "invalid credentials"
  exit 1
fi

PROJECT_NAME=$(read_yaml "name")
PROJECT_NAME=${PROJECT_NAME:-"myapp"}

info "Creating Cloudflare Pages projects..."
for proj in landing client-portal admin-portal; do
  CF_PROJECT="$PROJECT_NAME-$proj"
  curl -sf -X POST \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$CF_PROJECT\",\"production_branch\":\"main\"}" \
    "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects" > /dev/null 2>&1 && \
    success "Created: $CF_PROJECT" || warn "Failed to create $CF_PROJECT (may already exist)"
done

# Write wrangler.toml per project
ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"
for proj in landing client-portal admin-portal; do
  if [ -d "$ROOT_DIR/$proj" ]; then
    cat > "$ROOT_DIR/$proj/wrangler.toml" <<EOF
name = "$PROJECT_NAME-$proj"
pages_build_output_dir = "dist"
compatibility_date = "2026-01-01"
EOF
    # SPA _redirects
    echo "/* /index.html 200" > "$ROOT_DIR/$proj/public/_redirects"
  fi
done

ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
{
  echo ""
  echo "# Cloudflare"
  echo "CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID"
  echo "CLOUDFLARE_API_TOKEN=$CF_API_TOKEN"
} >> "$ENV_FILE"

success "Cloudflare Pages configured. Deploy: just deploy"
write_state "static" "ok" "cloudflare"
