#!/bin/bash
# setup/dev/caveman_setup.sh — install caveman Claude Code plugin
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

header "CAVEMAN PLUGIN"
info "Terse response mode for Claude Code sessions."
info "Drops filler words — keeps all technical substance."
echo ""

if confirm "Install caveman plugin for Claude Code?"; then
  if command -v claude > /dev/null 2>&1; then
    claude plugin install caveman 2>/dev/null && success "caveman installed" || warn "caveman install failed — install manually via 'claude plugin install caveman'"
  else
    warn "claude CLI not found — install caveman manually after claude is available"
    arrow "claude plugin install caveman"
  fi
else
  skip "Skipping caveman plugin."
fi
