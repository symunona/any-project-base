#!/bin/bash
# setup/env/env_check.sh — list all vars, flag missing, show implications
# Also generates INSTALL_STATUS.md when run with --report
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"
EXAMPLE_FILE="$ROOT_DIR/.env.local.example"

REPORT_MODE=0
[[ "${1:-}" == "--report" ]] && REPORT_MODE=1

[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a 2>/dev/null || true

MISSING=()
PRESENT=()

while IFS= read -r line; do
  [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
  KEY=$(echo "$line" | cut -d= -f1)
  CURRENT="${!KEY:-}"
  if [ -z "$CURRENT" ]; then
    MISSING+=("$KEY")
  else
    PRESENT+=("$KEY")
  fi
done < "$EXAMPLE_FILE"

if [ "$REPORT_MODE" -eq 0 ]; then
  header "ENV CHECK"
  for k in "${PRESENT[@]}"; do
    success "$k"
  done
  for k in "${MISSING[@]}"; do
    warn "MISSING: $k"
  done
  echo ""
  if [ ${#MISSING[@]} -gt 0 ]; then
    warn "${#MISSING[@]} var(s) missing. Run: just setup env"
  else
    success "All vars present."
  fi
else
  # Generate INSTALL_STATUS.md
  DATE=$(date '+%Y-%m-%d %H:%M')
  PROJECT_NAME=$(read_yaml "name")
  DOMAIN=$(read_yaml "domain")
  AGENT=$(read_yaml "agent")
  PRICING=$(read_yaml "pricing_model")
  STATIC_HOST=$(read_yaml "static_host")

  collect_status() {
    local key=$1
    python3 -c "
import json
try:
    with open('$SETUP_DIR/.install-state.json') as f:
        d = json.load(f)
    e = d.get('$key', {})
    print(e.get('status','unknown') + '|' + e.get('note',''))
except:
    print('unknown|')
" 2>/dev/null || echo "unknown|"
  }

  cat > "$ROOT_DIR/INSTALL_STATUS.md" <<EOF
# Install Status
_Generated: $DATE_

## Project
- **Name:** ${PROJECT_NAME:-not set}
- **Domain:** ${DOMAIN:-not configured}
- **Agent:** ${AGENT:-not set}
- **Pricing:** ${PRICING:-none}
- **Static host:** ${STATIC_HOST:-not configured}

## Platform Status

| Platform | Status | Notes |
|----------|--------|-------|
| Supabase local | $(collect_status supabase | cut -d'|' -f1) | Docker |
| DNS | $(collect_status dns | cut -d'|' -f1) | $(collect_status dns | cut -d'|' -f2) |
| Static hosting | $(collect_status static | cut -d'|' -f1) | $(collect_status static | cut -d'|' -f2) |
| Stripe | $(collect_status stripe | cut -d'|' -f1) | $(collect_status stripe | cut -d'|' -f2) |
| Firebase | $(collect_status firebase | cut -d'|' -f1) | $(collect_status firebase | cut -d'|' -f2) |
| PostHog | $(collect_status posthog | cut -d'|' -f1) | $(collect_status posthog | cut -d'|' -f2) |
| Mobile | $(collect_status mobile | cut -d'|' -f1) | $(collect_status mobile | cut -d'|' -f2) |

## Env vars

- Present: ${#PRESENT[@]}
- Missing: ${#MISSING[@]} $([ ${#MISSING[@]} -gt 0 ] && echo "(run: just setup env)")

## Next steps

$([ ${#MISSING[@]} -gt 0 ] && echo "- Run \`just setup env\` to fill missing vars")
- Run \`just dev\` to start local development
- Run \`just setup health\` to check platform status
EOF
  echo "INSTALL_STATUS.md written."
fi
