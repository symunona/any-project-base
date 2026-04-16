#!/bin/bash
# setup/dev/beads_setup.sh — install beads context management tool
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

header "BEADS"
info "Context management for long AI coding sessions."
echo ""

if confirm "Install beads?"; then
  npm install -g beads-cli 2>/dev/null && success "beads installed" || {
    warn "npm install failed — try: pip install beads"
    pip install beads 2>/dev/null && success "beads installed via pip" || warn "beads install failed"
  }
else
  skip "Skipping beads."
fi
