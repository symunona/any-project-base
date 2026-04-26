#!/bin/bash
# setup/bootstrap.sh — downloadable project bootstrapper
# Usage: curl -fsSL https://raw.githubusercontent.com/your-org/any-project-base/main/setup/bootstrap.sh | bash
set -euo pipefail

REPO_URL="https://github.com/your-org/any-project-base"

# ── Minimal terminal UI (lib/ui.sh not available pre-clone) ──────────────────
GREEN='\033[0;32m'; CYAN='\033[0;36m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'
info()    { printf "  •  %s\n" "$1"; }
success() { printf "  ${GREEN}✓  %s${RESET}\n" "$1"; }
fail()    { printf "  ${RED}✗  %s${RESET}\n" "$1" >&2; exit 1; }
warn()    { printf "  ${YELLOW}⚠  %s${RESET}\n" "$1"; }
arrow()   { printf "  ${CYAN}→${RESET}  %s\n" "$1"; }
divider() { printf '%0.s━' {1..50}; printf '\n'; }
header()  { echo ""; divider; printf "  ${BOLD}${CYAN}%s${RESET}\n" "$1"; divider; echo ""; }

# ── Hard prereq checks ───────────────────────────────────────────────────────
header "ANY PROJECT BASE — BOOTSTRAP"

BASH_MAJOR="${BASH_VERSINFO[0]:-0}"
[ "$BASH_MAJOR" -lt 4 ] && fail "bash ≥ 4 required (found $BASH_VERSION). On macOS: brew install bash"

command -v curl  > /dev/null 2>&1 || fail "curl not found — install curl and retry"
command -v git   > /dev/null 2>&1 || fail "git not found — install git and retry"

success "bash, curl, git: OK"
echo ""

# ── TTY guard — required for read prompts when run via curl | bash ────────────
if [ ! -t 0 ] && [ ! -c /dev/tty ]; then
  fail "No terminal available. Save the script and run it directly: bash bootstrap.sh"
fi
[ ! -t 0 ] && exec < /dev/tty

# ── Node.js ──────────────────────────────────────────────────────────────────
NODE_MAJOR=$(node --version 2>/dev/null | tr -d 'v' | cut -d. -f1)
if [ "${NODE_MAJOR:-0}" -ge 20 ]; then
  success "node: $(node --version)"
else
  warn "Node.js ≥ 20 not found (found: $(node --version 2>/dev/null || echo 'none'))"
  if command -v nvm > /dev/null 2>&1 || [ -s "$HOME/.nvm/nvm.sh" ]; then
    info "Using nvm to install Node.js 20..."
    # shellcheck source=/dev/null
    [ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"
    nvm install 20 && nvm use 20 \
      && success "node $(node --version) installed via nvm" \
      || warn "nvm install failed — install Node.js ≥ 20 manually: https://nodejs.org"
  else
    warn "nvm not found. Install Node.js ≥ 20 manually: https://nodejs.org or https://github.com/nvm-sh/nvm"
    warn "Bootstrap will continue but 'pnpm install' may fail."
  fi
fi

# ── pnpm ─────────────────────────────────────────────────────────────────────
if pnpm --version > /dev/null 2>&1; then
  success "pnpm: $(pnpm --version)"
else
  info "Installing pnpm..."
  npm install -g pnpm \
    && success "pnpm installed" \
    || fail "pnpm install failed — ensure Node.js ≥ 20 is installed"
fi

# ── just ─────────────────────────────────────────────────────────────────────
if just --version > /dev/null 2>&1; then
  success "just: $(just --version)"
else
  info "Installing just..."
  OS="$(uname -s)"
  if [ "$OS" = "Darwin" ] && command -v brew > /dev/null 2>&1; then
    brew install just \
      && success "just installed via brew" \
      || fail "just install failed — see https://github.com/casey/just"
  elif command -v snap > /dev/null 2>&1; then
    snap install --edge just \
      && success "just installed via snap" \
      || fail "just install failed — see https://github.com/casey/just"
  elif command -v cargo > /dev/null 2>&1; then
    cargo install just \
      && success "just installed via cargo" \
      || fail "just install failed — see https://github.com/casey/just"
  else
    fail "just not found and no installer available (need brew, snap, or cargo). Install: https://github.com/casey/just"
  fi
fi
echo ""

# ── Project name ─────────────────────────────────────────────────────────────
header "NEW PROJECT"
info "This will clone the template into a new directory."
echo ""

DEFAULT_SLUG="my-saas"
while true; do
  printf "  ${YELLOW}Project name${RESET} ${DIM}(slug: a-z, 0-9, hyphens) [${DEFAULT_SLUG}]${RESET}: "
  read -r PROJECT_SLUG
  PROJECT_SLUG="${PROJECT_SLUG:-$DEFAULT_SLUG}"
  if [[ "$PROJECT_SLUG" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$ ]]; then
    break
  fi
  warn "Invalid slug: '$PROJECT_SLUG'. Use lowercase letters, numbers, hyphens only."
done

if [ -d "$PROJECT_SLUG" ]; then
  fail "Directory './$PROJECT_SLUG' already exists. Choose a different name or remove it."
fi

success "Project name: $PROJECT_SLUG"
echo ""

# ── Clone ─────────────────────────────────────────────────────────────────────
header "CLONING TEMPLATE"
info "Cloning from $REPO_URL..."
git clone "$REPO_URL" "$PROJECT_SLUG" \
  || fail "Clone failed. Check network and that $REPO_URL is accessible."
success "Cloned into ./$PROJECT_SLUG"
echo ""

# Remove origin — blank slate for the user's own remote
cd "$PROJECT_SLUG"
git remote remove origin 2>/dev/null && info "Git origin removed (add your own with: git remote add origin <url>)" || true
echo ""

# ── Install dependencies ──────────────────────────────────────────────────────
header "INSTALLING DEPENDENCIES"
pnpm install || fail "pnpm install failed — check Node.js version (≥ 20 required)"
success "Dependencies installed"
echo ""

# ── Done ──────────────────────────────────────────────────────────────────────
header "READY"
success "Project '$PROJECT_SLUG' is ready at ./$PROJECT_SLUG"
echo ""
info "What's next:"
arrow "Set up your GitHub remote:  git remote add origin <your-repo-url>"
arrow "Configure the project:      bash setup/install.sh"
arrow "Start developing:           just dev"
echo ""
printf "  ${BOLD}Ready to start ideating? This will run setup/install.sh${RESET} ${DIM}[Y/n]${RESET}: "
read -r IDEATE
IDEATE="${IDEATE:-Y}"
if [[ "$IDEATE" =~ ^[Yy]$ ]]; then
  echo ""
  exec bash setup/install.sh
else
  echo ""
  success "All set. When you're ready:"
  arrow "bash setup/install.sh"
  echo ""
fi
