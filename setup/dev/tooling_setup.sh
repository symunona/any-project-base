#!/bin/bash
# setup/dev/tooling_setup.sh — install pnpm, docker, just, supabase CLI
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

header "DEV TOOLING"
info "Installing required development tools."
echo ""

# ── Node.js ───────────────────────────────────────────────────────────────────
NODE_VERSION=$(node --version 2>/dev/null | tr -d 'v' | cut -d. -f1)
if [ "${NODE_VERSION:-0}" -ge 20 ]; then
  success "Node.js: $(node --version)"
else
  warn "Node.js >= 20 required. Current: $(node --version 2>/dev/null || echo 'not found')"
  arrow "Install: https://nodejs.org or use nvm: nvm install 20"
fi

# ── pnpm ──────────────────────────────────────────────────────────────────────
if pnpm --version > /dev/null 2>&1; then
  success "pnpm: already installed"
else
  info "Installing pnpm..."
  npm install -g pnpm && success "pnpm installed" || { fail "pnpm install failed"; exit 1; }
fi

# ── Docker ────────────────────────────────────────────────────────────────────
if docker --version > /dev/null 2>&1; then
  success "Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
else
  warn "Docker not found — required for local Supabase."
  arrow "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
fi

# ── just ──────────────────────────────────────────────────────────────────────
if just --version > /dev/null 2>&1; then
  success "just: already installed"
else
  info "Installing just..."
  if brew install just 2>/dev/null; then
    success "just installed via brew"
  elif snap install --edge just 2>/dev/null; then
    success "just installed via snap"
  elif cargo install just 2>/dev/null; then
    success "just installed via cargo"
  else
    fail "just install failed — install manually: https://github.com/casey/just"
  fi
fi

# ── Supabase CLI ──────────────────────────────────────────────────────────────
install_supabase_linux() {
  local tmp latest arch url bin_dir
  tmp=$(mktemp -d)

  latest=$(curl -sf "https://api.github.com/repos/supabase/cli/releases/latest" \
    | grep -oP '"tag_name":"\Kv[^"]+' || echo "")
  if [ -z "$latest" ]; then
    rm -rf "$tmp"
    fail "Could not fetch supabase CLI version from GitHub"
    return 1
  fi

  arch=$(uname -m)
  [ "$arch" = "x86_64" ] && arch="amd64" || arch="arm64"

  url="https://github.com/supabase/cli/releases/download/${latest}/supabase_linux_${arch}.tar.gz"
  info "Downloading supabase CLI ${latest} (linux/${arch})..."

  if ! curl -sL "$url" | tar xz -C "$tmp"; then
    rm -rf "$tmp"
    fail "Download or extraction failed"
    return 1
  fi

  # Install to ~/.local/bin — no sudo needed
  bin_dir="$HOME/.local/bin"
  mkdir -p "$bin_dir"
  mv "$tmp/supabase" "$bin_dir/supabase"
  chmod +x "$bin_dir/supabase"
  rm -rf "$tmp"

  if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
    warn "~/.local/bin not in PATH. Add to your shell profile:"
    arrow 'export PATH="$HOME/.local/bin:$PATH"'
  fi
}

if supabase --version > /dev/null 2>&1; then
  success "supabase: already installed ($(supabase --version))"
else
  info "Installing supabase CLI..."
  OS="$(uname -s)"
  if [ "$OS" = "Darwin" ] && brew --version > /dev/null 2>&1; then
    brew install supabase/tap/supabase \
      && success "supabase installed via brew" \
      || fail "supabase brew install failed — see https://github.com/supabase/cli#install-the-cli"
  elif [ "$OS" = "Linux" ]; then
    install_supabase_linux \
      && success "supabase installed to ~/.local/bin" \
      || fail "supabase install failed — see https://github.com/supabase/cli#install-the-cli"
  else
    fail "supabase auto-install not supported on $OS — see https://github.com/supabase/cli#install-the-cli"
  fi
fi

# ── EAS CLI (optional — mobile only) ─────────────────────────────────────────
if eas --version > /dev/null 2>&1; then
  success "EAS CLI: $(eas --version)"
else
  info "EAS CLI not installed (optional — mobile app store builds only)"
fi

echo ""
success "Dev tooling check complete."
