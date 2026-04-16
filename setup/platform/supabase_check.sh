#!/bin/bash
# setup/platform/supabase_check.sh
# Checks: local Docker running, cloud connected, types fresh
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/yaml.sh"

# Load env
ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

# Check local Docker
if ! docker ps 2>/dev/null | grep -q supabase; then
  echo "FAIL Supabase local Docker not running — run: supabase start"
  exit 1
fi

# Check cloud (if configured)
if [ -n "${SUPABASE_URL:-}" ]; then
  if ! curl -sf -H "apikey: ${VITE_SUPABASE_ANON_KEY:-}" "$SUPABASE_URL/rest/v1/" > /dev/null 2>&1; then
    echo "FAIL Supabase cloud unreachable — check keys"
    exit 1
  fi
fi

# Check types freshness (db.types.ts should not have GENERATED placeholder)
TYPES_FILE="$(cd "$SETUP_DIR/.." && pwd)/commons/types/db.types.ts"
if grep -q 'GENERATED placeholder' "$TYPES_FILE" 2>/dev/null; then
  echo "FAIL db.types.ts is a placeholder — run: just db-types"
  exit 1
fi

echo "OK"
