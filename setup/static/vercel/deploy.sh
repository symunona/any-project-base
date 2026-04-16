#!/bin/bash
# setup/static/vercel/deploy.sh
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

header "DEPLOY → Vercel ($APP_ENV)"

for proj in landing client-portal admin-portal; do
  info "Building $proj..."
  (cd "$ROOT_DIR" && VITE_APP_ENV=$APP_ENV pnpm run build --filter="$proj")

  info "Deploying $PROJECT_NAME-$proj..."
  vercel deploy "$ROOT_DIR/$proj/dist" --prod --token="$VERCEL_TOKEN" && \
    success "$proj deployed" || fail "$proj deploy failed"
done
