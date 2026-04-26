# Bootstrap Install Script — Design

**Date:** 2026-04-26
**Status:** Approved

---

## Goal

Single `curl | bash` command that takes a developer from zero to a cloned, renamed, dependency-installed project, then optionally launches `setup/install.sh`.

```bash
curl -fsSL https://raw.githubusercontent.com/symunona/any-project-base/main/setup/bootstrap.sh | bash
```

---

## Scope

Two deliverables:
1. `setup/bootstrap.sh` — self-contained bootstrap script
2. Landing page `get-started` section (en/es/ko) documenting the command

---

## Bootstrap Script

**File:** `setup/bootstrap.sh`
**Constraint:** runs before the repo is cloned — no access to `lib/ui.sh`. Inlines a minimal terminal UI (~5 lines of color/icon helpers).

### Flow

| Step | Action | Failure mode |
|------|--------|-------------|
| 1 | Check bash ≥4, curl, git | `fail` with install hint, exit 1 |
| 2 | Install node via nvm (skip if node present) | warn + continue |
| 3 | Install pnpm via `npm i -g pnpm` (skip if present) | warn + continue |
| 4 | Install `just` — brew on macOS, cargo on Linux fallback (mirrors `tooling_setup.sh`; skip if present) | warn + continue |
| 5 | Prompt: `Project name [my-saas]:` — validates `^[a-z0-9-]+$` | re-prompt on invalid |
| 6 | Clone template repo into `./<slug>` | exit 1 on clone failure |
| 7 | Remove git origin (blank slate) | non-fatal |
| 8 | `cd <slug> && pnpm install` | exit 1 on failure |
| 9 | Prompt: `Ready to start ideating? (runs setup/install.sh) [Y/n]` | |
| 9a | Yes → `exec bash setup/install.sh` | |
| 9b | No → print `cd <slug> && bash setup/install.sh` | |

### What it does NOT do
- Deep rename (package.json, project.yaml fields) — handled by `setup/init/project.sh` in step 2 of `setup/install.sh`
- Push to a new git remote — user does this after setup
- Install Docker — left to `setup/dev/tooling_setup.sh`

### Terminal UI
Inlines minimal helpers (not sourced from lib/ui.sh):
```bash
GREEN='\033[0;32m'; CYAN='\033[0;36m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; RESET='\033[0m'
info()    { printf "  •  %s\n" "$1"; }
success() { printf "  ${GREEN}✓  %s${RESET}\n" "$1"; }
fail()    { printf "  ${RED}✗  %s${RESET}\n" "$1"; exit 1; }
warn()    { printf "  ${YELLOW}⚠  %s${RESET}\n" "$1"; }
```

---

## Landing Page Changes

**Files:** `landing/index.html`, `landing/en/index.html`, `landing/es/index.html`, `landing/ko/index.html`

Add a `#get-started` section with:
- Section heading: "One command to start"
- The curl command in a copyable code block
- 4-line bullet list of what happens (install deps → clone → rename → ideate)
- Existing CTA (Log in) stays unchanged

Section placement: after the features/hero section, before footer.

---

## Files Created / Modified

| File | Action |
|------|--------|
| `setup/bootstrap.sh` | Create |
| `landing/index.html` | Add `#get-started` section |
| `landing/en/index.html` | Add translated section (if exists) |
| `landing/es/index.html` | Add translated section |
| `landing/ko/index.html` | Add translated section |
| `landing/styles/landing.css` | Add styles for `.get-started` section |

---

## Out of Scope

- Versioned release artifacts
- Windows support (bash-only)
- Auto-detection of editor to open
