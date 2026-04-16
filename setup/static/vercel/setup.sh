#!/bin/bash
# setup/static/vercel/setup.sh — Vercel setup
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

header "VERCEL SETUP"
info "Hosts landing, client-portal, admin-portal."
info "Best DX: git push = auto deploy."
echo ""

arrow "Go to https://vercel.com/signup"
arrow "Settings → Tokens → Create token → copy"
echo ""

prompt_input "Paste Vercel Token" VERCEL_TOKEN || {
  skip "Skipping Vercel."; write_state "static" "skipped" "user skipped"; exit 0
}

if ! curl -sf -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v2/user" > /dev/null 2>&1; then
  fail "Vercel API rejected token."
  write_state "static" "fail" "invalid token"
  exit 1
fi

PROJECT_NAME=$(read_yaml "name")
PROJECT_NAME=${PROJECT_NAME:-"myapp"}
ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"

info "Creating Vercel projects..."
for proj in landing client-portal admin-portal; do
  curl -sf -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$PROJECT_NAME-$proj\",\"framework\":\"vite\"}" \
    "https://api.vercel.com/v10/projects" > /dev/null 2>&1 && \
    success "Created: $PROJECT_NAME-$proj" || warn "$PROJECT_NAME-$proj may already exist"

  # SPA vercel.json
  if [ -d "$ROOT_DIR/$proj" ]; then
    cat > "$ROOT_DIR/$proj/vercel.json" <<'EOF'
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
EOF
  fi
done

ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
{
  echo ""
  echo "# Vercel"
  echo "VERCEL_TOKEN=$VERCEL_TOKEN"
} >> "$ENV_FILE"

success "Vercel configured. Deploy: just deploy"
write_state "static" "ok" "vercel"
