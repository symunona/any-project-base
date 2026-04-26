#!/bin/bash
# setup/dev/tooling_setup.sh — install pnpm, docker, just, supabase CLI
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

STATE_FILE="$SETUP_DIR/.tooling-state"

# Record install state: track=pre-existing if already installed, track=<method> if we installed it
track() {
  local key=$1 value=$2
  # Only write if not already recorded (don't overwrite pre-existing on re-run)
  if ! grep -q "^${key}=" "$STATE_FILE" 2>/dev/null; then
    echo "${key}=${value}" >> "$STATE_FILE"
  fi
}

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
  track "pnpm" "pre-existing"
else
  info "Installing pnpm..."
  npm install -g pnpm && success "pnpm installed" || { fail "pnpm install failed"; exit 1; }
  track "pnpm" "npm"
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
  track "just" "pre-existing"
else
  info "Installing just..."
  if brew install just 2>/dev/null; then
    success "just installed via brew"
    track "just" "brew"
  elif snap install --edge just 2>/dev/null; then
    success "just installed via snap"
    track "just" "snap"
  elif cargo install just 2>/dev/null; then
    success "just installed via cargo"
    track "just" "cargo"
  else
    fail "just install failed — install manually: https://github.com/casey/just"
  fi
fi

# ── Supabase CLI ──────────────────────────────────────────────────────────────
install_supabase_linux() {
  local tmp latest arch url bin_dir
  tmp=$(mktemp -d)

  latest=$(curl -sf "https://api.github.com/repos/supabase/cli/releases/latest" \
    | grep -oP '"tag_name":"\Kv[^"]+' || true)
  if [ -z "$latest" ]; then
    latest=$(curl -sI "https://github.com/supabase/cli/releases/latest" \
      | grep -i '^location:' | awk '{print $2}' | tr -d '\r' | xargs basename || true)
  fi
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
  track "supabase" "pre-existing"
else
  info "Installing supabase CLI..."
  OS="$(uname -s)"
  if [ "$OS" = "Darwin" ] && brew --version > /dev/null 2>&1; then
    brew install supabase/tap/supabase \
      && success "supabase installed via brew" && track "supabase" "brew" \
      || fail "supabase brew install failed — see https://github.com/supabase/cli#install-the-cli"
  elif [ "$OS" = "Linux" ]; then
    install_supabase_linux \
      && success "supabase installed to ~/.local/bin" && track "supabase" "linux-binary" \
      || fail "supabase install failed — see https://github.com/supabase/cli#install-the-cli"
  else
    fail "supabase auto-install not supported on $OS — see https://github.com/supabase/cli#install-the-cli"
  fi
fi

# ── Caddy (local reverse proxy for *.localhost subdomains) ───────────────────
install_caddy_linux() {
  local tmp latest arch version url redirect_url
  tmp=$(mktemp -d)

  # Try GitHub API first; fall back to following the /releases/latest redirect
  latest=$(curl -sf "https://api.github.com/repos/caddyserver/caddy/releases/latest" \
    | grep -oP '"tag_name":"\Kv[^"]+' || true)
  if [ -z "$latest" ]; then
    redirect_url=$(curl -sI "https://github.com/caddyserver/caddy/releases/latest" \
      | grep -i '^location:' | awk '{print $2}' | tr -d '\r' || true)
    latest=$(basename "$redirect_url")
  fi
  if [ -z "$latest" ]; then
    rm -rf "$tmp"
    fail "Could not determine Caddy version — check network connectivity"
    return 1
  fi

  arch=$(uname -m)
  [ "$arch" = "x86_64" ] && arch="amd64" || arch="arm64"
  version="${latest#v}"
  url="https://github.com/caddyserver/caddy/releases/download/${latest}/caddy_${version}_linux_${arch}.tar.gz"
  info "Downloading Caddy ${latest} (linux/${arch})..."

  if ! curl -sL "$url" | tar xz -C "$tmp"; then
    rm -rf "$tmp"
    fail "Caddy download or extraction failed"
    return 1
  fi

  local bin_dir="$HOME/.local/bin"
  mkdir -p "$bin_dir"
  mv "$tmp/caddy" "$bin_dir/caddy"
  chmod +x "$bin_dir/caddy"
  rm -rf "$tmp"
}

if caddy version > /dev/null 2>&1; then
  success "caddy: already installed ($(caddy version 2>/dev/null | head -1))"
  track "caddy" "pre-existing"
else
  info "Installing Caddy (local reverse proxy for *.localhost subdomains)..."
  OS="$(uname -s)"
  if [ "$OS" = "Darwin" ] && brew --version > /dev/null 2>&1; then
    brew install caddy \
      && success "caddy installed via brew" && track "caddy" "brew" \
      || fail "caddy install failed — see https://caddyserver.com/docs/install"
  elif [ "$OS" = "Linux" ]; then
    install_caddy_linux \
      && success "caddy installed to ~/.local/bin" && track "caddy" "linux-binary" \
      || fail "caddy install failed — see https://caddyserver.com/docs/install"
  else
    fail "caddy auto-install not supported on $OS — see https://caddyserver.com/docs/install"
  fi
fi

# Linux only: grant Caddy port-80 binding via setcap (one-time sudo — permanent after)
if [ "$(uname -s)" = "Linux" ] && caddy version > /dev/null 2>&1; then
  CADDY_BIN=$(which caddy 2>/dev/null || echo "$HOME/.local/bin/caddy")
  if ! getcap "$CADDY_BIN" 2>/dev/null | grep -q cap_net_bind_service; then
    info "Granting Caddy permission to bind port 80 (requires sudo — one time only)."
    arrow "Why: Linux restricts ports < 1024 to root by default. setcap lets Caddy"
    arrow "bind port 80 permanently as your user — no sudo ever again after this."
    sudo setcap cap_net_bind_service=+ep "$CADDY_BIN" \
      && success "setcap done — Caddy can now bind port 80 without sudo" \
      || warn "setcap failed — 'just start' may prompt for sudo when starting Caddy"
  else
    success "caddy: port-80 setcap already granted"
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
