#!/bin/bash
# setup/dev/tooling_setup.sh — install pnpm, docker, just, supabase CLI
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

header "DEV TOOLING"
info "Installing required development tools."
echo ""

check_or_install() {
  local name=$1 check_cmd=$2 install_cmd=$3
  if eval "$check_cmd" > /dev/null 2>&1; then
    success "$name: already installed"
  else
    info "Installing $name..."
    if eval "$install_cmd"; then
      success "$name installed"
    else
      fail "$name installation failed — install manually"
    fi
  fi
}

# pnpm
check_or_install "pnpm" "pnpm --version" "npm install -g pnpm@9"

# Node.js >= 20
NODE_VERSION=$(node --version 2>/dev/null | tr -d 'v' | cut -d. -f1)
if [ "${NODE_VERSION:-0}" -ge 20 ]; then
  success "Node.js: $(node --version)"
else
  warn "Node.js >= 20 required. Current: $(node --version 2>/dev/null || echo 'not found')"
  arrow "Install: https://nodejs.org or use nvm: nvm install 20"
fi

# Docker
if docker --version > /dev/null 2>&1; then
  success "Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
else
  warn "Docker not found."
  arrow "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
fi

# just (command runner)
check_or_install "just" "just --version" "cargo install just 2>/dev/null || brew install just 2>/dev/null || snap install --edge just"

# Supabase CLI
check_or_install "supabase" "supabase --version" "brew install supabase/tap/supabase 2>/dev/null || npm install -g supabase"

# EAS CLI (optional)
if eas --version > /dev/null 2>&1; then
  success "EAS CLI: $(eas --version)"
else
  info "EAS CLI not found (optional — for app store builds)"
  if confirm "Install EAS CLI?"; then
    npm install -g eas-cli && success "EAS CLI installed" || warn "EAS CLI install failed"
  fi
fi

echo ""
success "Dev tooling check complete."
write_state() { true; }
