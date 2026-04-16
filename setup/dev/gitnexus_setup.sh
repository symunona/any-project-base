#!/bin/bash
# setup/dev/gitnexus_setup.sh
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

header "GITNEXUS"
info "Git workflow automation for AI-assisted development."
echo ""

if confirm "Install gitnexus?"; then
  npm install -g gitnexus 2>/dev/null && success "gitnexus installed" || warn "gitnexus install failed — install manually"
else
  skip "Skipping gitnexus."
fi
