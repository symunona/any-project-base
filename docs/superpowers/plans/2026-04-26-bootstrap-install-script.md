# Bootstrap Install Script Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `setup/bootstrap.sh` — a self-contained `curl | bash` script that installs prerequisites, clones the template, and optionally launches setup — then update the landing page CTA to show the new command.

**Architecture:** Single self-contained bash script (no repo dependencies pre-clone). Inlines minimal terminal UI helpers. Mirrors `tooling_setup.sh` patterns for tool installation. Landing page update replaces existing `cta-terminal` command text only — no structural changes.

**Tech Stack:** Bash, curl, git, nvm (node), npm (pnpm), brew/cargo (just)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `setup/bootstrap.sh` | Create | Full bootstrap: prereqs → clone → pnpm install → ideation prompt |
| `landing/index.html` | Modify line 455 | Replace git clone command with curl command |

---

### Task 1: Create `setup/bootstrap.sh`

**Files:**
- Create: `setup/bootstrap.sh`

- [ ] **Step 1: Create the file with header, UI helpers, and prereq checks**

```bash
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
```

- [ ] **Step 2: Add node, pnpm, just installation**

Append to `setup/bootstrap.sh`:

```bash
# ── Node.js ──────────────────────────────────────────────────────────────────
NODE_MAJOR=$(node --version 2>/dev/null | tr -d 'v' | cut -d. -f1 || echo "0")
if [ "${NODE_MAJOR}" -ge 20 ] 2>/dev/null; then
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
  elif command -v cargo > /dev/null 2>&1; then
    cargo install just \
      && success "just installed via cargo" \
      || fail "just install failed — see https://github.com/casey/just"
  else
    fail "just not found and no installer available (need brew or cargo). Install: https://github.com/casey/just"
  fi
fi
echo ""
```

- [ ] **Step 3: Add project name prompt with slug validation**

Append to `setup/bootstrap.sh`:

```bash
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
```

- [ ] **Step 4: Add clone, origin removal, pnpm install, and ideation prompt**

Append to `setup/bootstrap.sh`:

```bash
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
  arrow "cd $PROJECT_SLUG"
  arrow "bash setup/install.sh"
  echo ""
fi
```

- [ ] **Step 5: Make executable and verify syntax**

```bash
chmod +x setup/bootstrap.sh
bash -n setup/bootstrap.sh && echo "Syntax OK"
```

Expected output: `Syntax OK`

- [ ] **Step 6: Commit**

```bash
git add setup/bootstrap.sh
git commit -m "feat: add curl-installable bootstrap script"
```

---

### Task 2: Update landing page CTA command

**Files:**
- Modify: `landing/index.html:455`

- [ ] **Step 1: Replace the git clone command with the curl bootstrap command**

In `landing/index.html`, find and replace the `cta-terminal` div content (line 454–456):

Old:
```html
      <div class="cta-terminal" aria-label="Setup command">
        <span class="code-prompt">$</span> git clone https://github.com/your-org/any-project-base &amp;&amp; just setup
      </div>
```

New:
```html
      <div class="cta-terminal" aria-label="Bootstrap command">
        <span class="code-prompt">$</span> curl -fsSL https://raw.githubusercontent.com/your-org/any-project-base/main/setup/bootstrap.sh | bash
      </div>
```

- [ ] **Step 2: Update the description text above it**

Old (line 453):
```html
      <p>Open source, MIT licensed. Clone it, fork it, ship it.</p>
```

New:
```html
      <p>Open source, MIT licensed. One command sets up everything — tools, deps, and your new project.</p>
```

- [ ] **Step 3: Verify HTML is valid (no broken entities)**

```bash
grep -n "cta-terminal" landing/index.html
```

Expected: one match with the curl command visible.

- [ ] **Step 4: Commit**

```bash
git add landing/index.html
git commit -m "feat(landing): update CTA to show curl bootstrap command"
```

---

## Manual Verification Checklist

After both tasks complete:

- [ ] `bash -n setup/bootstrap.sh` exits 0
- [ ] `setup/bootstrap.sh` has execute bit: `ls -la setup/bootstrap.sh | grep -o '^-rwx'`
- [ ] Landing page shows curl command: `grep "curl" landing/index.html`
- [ ] Script handles existing directory: run twice with same name → should fail with clear message
- [ ] Slug validation rejects `"My Project"` and `"-bad"`, accepts `"my-saas"` and `"a"`
