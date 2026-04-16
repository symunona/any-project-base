#!/bin/bash
# setup/env/env_setup.sh — interactive: walk through missing env vars
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"
EXAMPLE_FILE="$ROOT_DIR/.env.local.example"

header "ENV SETUP"
info "Walk through missing environment variables."
echo ""

if [ ! -f "$EXAMPLE_FILE" ]; then
  fail ".env.local.example not found."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  touch "$ENV_FILE"
  info "Created .env.local"
fi

# Load current values
set -a && source "$ENV_FILE" && set +a 2>/dev/null || true

MISSING=0
while IFS= read -r line; do
  # Skip comments and blanks
  [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue

  KEY=$(echo "$line" | cut -d= -f1)
  CURRENT="${!KEY:-}"

  if [ -z "$CURRENT" ]; then
    MISSING=$((MISSING + 1))
    warn "Missing: $KEY"
    prompt_input "  Value for $KEY" NEW_VAL || continue
    echo "$KEY=$NEW_VAL" >> "$ENV_FILE"
    success "  $KEY set"
  fi
done < "$EXAMPLE_FILE"

echo ""
if [ "$MISSING" -eq 0 ]; then
  success "All env vars configured."
else
  info "Added $MISSING var(s) to .env.local."
fi
