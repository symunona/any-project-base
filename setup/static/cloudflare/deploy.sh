#!/bin/bash
# setup/static/cloudflare/deploy.sh
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

PROJECT_NAME=$(read_yaml "name")
PROJECT_NAME=${PROJECT_NAME:-"myapp"}

APP_ENV=${VITE_APP_ENV:-prod}

header "DEPLOY → Cloudflare Pages ($APP_ENV)"

for proj in landing client-portal admin-portal; do
  info "Building $proj..."
  (cd "$ROOT_DIR" && VITE_APP_ENV=$APP_ENV pnpm run build --filter="$proj")

  CF_PROJECT="$PROJECT_NAME-$proj"
  info "Deploying $CF_PROJECT..."
  wrangler pages deploy "$ROOT_DIR/$proj/dist" \
    --project-name="$CF_PROJECT" \
    --commit-dirty=true && success "$CF_PROJECT deployed" || fail "$CF_PROJECT deploy failed"
done
