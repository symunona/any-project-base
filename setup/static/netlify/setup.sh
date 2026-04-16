#!/bin/bash
# setup/static/netlify/setup.sh — Netlify setup
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

header "NETLIFY SETUP"
info "Hosts landing, client-portal, admin-portal."
echo ""

arrow "Go to https://app.netlify.com/signup"
arrow "User settings → Applications → Personal access tokens → New token"
echo ""

prompt_input "Paste Netlify token" NETLIFY_AUTH_TOKEN || {
  skip "Skipping Netlify."; write_state "static" "skipped" "user skipped"; exit 0
}

if ! curl -sf -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    "https://api.netlify.com/api/v1/user" > /dev/null 2>&1; then
  fail "Netlify API rejected token."
  write_state "static" "fail" "invalid token"
  exit 1
fi

PROJECT_NAME=$(read_yaml "name")
PROJECT_NAME=${PROJECT_NAME:-"myapp"}
ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"

info "Creating Netlify sites..."
for proj in landing client-portal admin-portal; do
  SITE_NAME="$PROJECT_NAME-$(echo $proj | tr -d -)"
  curl -sf -X POST \
    -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$SITE_NAME\"}" \
    "https://api.netlify.com/api/v1/sites" > /dev/null 2>&1 && \
    success "Created: $SITE_NAME" || warn "$SITE_NAME may already exist"

  # SPA netlify.toml
  if [ -d "$ROOT_DIR/$proj" ]; then
    cat > "$ROOT_DIR/$proj/netlify.toml" <<'EOF'
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
  fi
done

ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
{
  echo ""
  echo "# Netlify"
  echo "NETLIFY_AUTH_TOKEN=$NETLIFY_AUTH_TOKEN"
} >> "$ENV_FILE"

success "Netlify configured. Deploy: just deploy"
write_state "static" "ok" "netlify"
