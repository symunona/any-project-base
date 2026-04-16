#!/bin/bash
# setup/checks/auth_check.sh
# Check: env vars present, dev-login guard in place, seed users defined
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FAIL=0

# Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
ENV_FILE="$ROOT_DIR/.env.local"
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE" 2>/dev/null || true
fi

[ -z "${VITE_SUPABASE_URL:-}" ] && echo "WARN VITE_SUPABASE_URL not set (local dev only)" || true
[ -z "${VITE_SUPABASE_ANON_KEY:-}" ] && echo "WARN VITE_SUPABASE_ANON_KEY not set" || true

# dev-login guard: APP_ENV=prod → 403
DEV_LOGIN="$ROOT_DIR/supabase/functions/dev-login/index.ts"
if [ -f "$DEV_LOGIN" ]; then
  if ! grep -q "APP_ENV.*prod" "$DEV_LOGIN" && ! grep -q "prod.*403" "$DEV_LOGIN"; then
    echo "FAIL dev-login/index.ts missing prod guard (APP_ENV=prod → 403)"
    FAIL=1
  fi
fi

# Frontend DevLogin guard: config.appEnv === 'prod' → return null
COMMONS_DEV_LOGIN="$ROOT_DIR/commons/components/DevLogin.tsx"
if [ -f "$COMMONS_DEV_LOGIN" ]; then
  if ! grep -q "appEnv.*prod" "$COMMONS_DEV_LOGIN"; then
    echo "FAIL commons/components/DevLogin.tsx missing appEnv=prod guard"
    FAIL=1
  fi
fi

# Seed users must be in seed.sql
SEED_FILE="$ROOT_DIR/supabase/seed.sql"
if [ -f "$SEED_FILE" ]; then
  for email in admin@dev.local support@dev.local user@dev.local; do
    if ! grep -q "$email" "$SEED_FILE"; then
      echo "FAIL seed.sql missing user: $email"
      FAIL=1
    fi
  done
fi

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
