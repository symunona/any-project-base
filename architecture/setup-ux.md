# Setup UX Architecture

All setup scripts source `setup/lib/ui.sh`. Consistent terminal UI across every script.

---

## setup/lib/ui.sh

### Colors + Icons

```bash
#!/bin/bash
# setup/lib/ui.sh — source this in every setup script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# Icons
ICON_OK="✓"
ICON_FAIL="✗"
ICON_WARN="⚠"
ICON_ARROW="→"
ICON_SKIP="↷"
ICON_INFO="•"
ICON_WAIT="…"
ICON_CURSOR="▶"

WIDTH=50  # divider width
```

### Components

```bash
divider() { printf '%*s\n' "$WIDTH" '' | tr ' ' '━'; }

header() {
  echo ""
  divider
  printf "  ${BOLD}${CYAN}%s${RESET}\n" "$1"
  divider
  echo ""
}

step() {
  # step 3 "STRIPE" 7
  local num=$1 name=$2 total=$3
  local filled=$(( num * 10 / total ))
  local empty=$(( 10 - filled ))
  local bar=""
  for ((i=0; i<filled; i++)); do bar+="█"; done
  for ((i=0; i<empty; i++)); do bar+="░"; done

  echo ""
  divider
  printf "  ${DIM}[${bar}]${RESET} ${BOLD}Step %s of %s${RESET} — ${BOLD}${CYAN}%s${RESET}\n" \
    "$num" "$total" "$name"
  divider
  echo ""
}

info()    { printf "  ${ICON_INFO}  %s\n" "$1"; }
warn()    { printf "  ${YELLOW}${ICON_WARN}  %s${RESET}\n" "$1"; }
success() { printf "  ${GREEN}${ICON_OK}  %s${RESET}\n" "$1"; }
fail()    { printf "  ${RED}${ICON_FAIL}  %s${RESET}\n" "$1"; }
arrow()   { printf "  ${CYAN}${ICON_ARROW}${RESET}  %s\n" "$1"; }
skip()    { printf "  ${YELLOW}${ICON_SKIP}  %s${RESET}\n" "$1"; }

prompt_input() {
  # prompt_input "Paste API key" VAR_NAME
  local label=$1 varname=$2
  printf "  ${YELLOW}%s${RESET} ${DIM}(s=skip, q=quit)${RESET}: " "$label"
  read -r input
  if [[ "$input" == "s" ]]; then return 1; fi
  if [[ "$input" == "q" ]]; then echo ""; info "Quitting setup."; exit 0; fi
  eval "$varname='$input'"
  return 0
}

confirm() {
  # confirm "Continue without Stripe?" → returns 0=yes 1=no
  printf "  ${YELLOW}%s${RESET} ${DIM}[y/N]${RESET}: " "$1"
  read -r ans
  [[ "$ans" =~ ^[Yy]$ ]]
}

status_row() {
  # status_row "Stripe" "skipped" "billing disabled"
  local name=$1 status=$2 note=$3
  case $status in
    ok)      icon="${GREEN}${ICON_OK} ${RESET}" ;;
    skipped) icon="${YELLOW}${ICON_SKIP}${RESET}" ;;
    fail)    icon="${RED}${ICON_FAIL}${RESET}" ;;
  esac
  printf "  %b  %-20s %s\n" "$icon" "$name" "${DIM}${note}${RESET}"
}
```

---

## Install Script: setup/install.sh

### First run — sequential

Steps run in order. Every prompt shows `s=skip, q=quit`. Skipped steps logged to `setup/.install-state.json`.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SETUP  —  Step 6 of 9
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓  1  Agent selector
  ✓  2  Project init
  ✓  3  DNS setup
  ✓  4  Dev tooling
  ✓  5  Supabase cloud
  ▶  6  Stripe
     7  Firebase
     8  PostHog
     9  Pricing model

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  •  Handles payments, subscriptions, credits.
  ⚠  Without this: billing disabled → pricing_model: none.

  → Go to https://dashboard.stripe.com/register
  → Settings → Developers → API keys → copy "Secret key"

  Paste Secret key (s=skip, q=quit): _
```

Color scheme:
- Past + done: `GREEN ✓` + white text
- Past + skipped: `YELLOW ↷` + dim text
- Current: `CYAN ▶` + bold cyan text
- Future: dim gray, no icon

Step list reprinted at top of every step — user always knows position. Never just a bar.

After each step: write result to `setup/.install-state.json`:
```json
{
  "agent": { "status": "ok", "value": "claude" },
  "project": { "status": "ok" },
  "dns": { "status": "skipped" },
  "supabase": { "status": "ok" },
  "stripe": { "status": "skipped", "note": "billing disabled" },
  "firebase": { "status": "fail", "note": "invalid key" },
  "posthog": { "status": "ok" },
  "pricing_model": { "status": "ok", "value": "none" }
}
```

### Re-run — interactive menu

Detected via: `setup/.install-state.json` exists.

Display menu with arrow key navigation. Status icons inline. Cursor highlights selected step.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SETUP MENU                       (↑↓ navigate, ↵ run, q quit)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ✓  Agent selector
    ✓  Project init
    ↷  DNS setup
    ✓  Dev tooling
  ▶ ✗  Stripe              → billing disabled
    ✗  Firebase            → push notifications broken
    ✓  PostHog
    ✓  Pricing model

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Arrow key navigation:
```bash
read_key() {
  read -s -n1 key
  if [[ $key == $'\x1b' ]]; then
    read -s -n2 key
    case $key in
      '[A') echo "up" ;;
      '[B') echo "down" ;;
    esac
  elif [[ $key == "" ]]; then echo "enter"
  elif [[ $key == "q" ]]; then echo "quit"
  fi
}
```

After step runs → clears screen → returns to menu with updated status.

### Step order

| # | Step | Script | Skippable |
|---|------|--------|-----------|
| 1 | Agent selector | setup/init/agent.sh | No |
| 2 | Project init | setup/init/project.sh | No |
| 3 | DNS setup | setup/platform/dns_setup.sh | Yes |
| 4 | Dev tooling | setup/dev/tooling_setup.sh | No |
| 5 | Supabase cloud | setup/platform/supabase_setup.sh | Yes (local dev works) |
| 6 | Stripe | setup/platform/stripe_setup.sh | Yes |
| 7 | Firebase | setup/platform/firebase_setup.sh | Yes |
| 8 | PostHog | setup/platform/posthog_setup.sh | Yes |
| 9 | Pricing model | setup/pricing/setup_pricing.sh | No (defaults to none) |

---

## End of setup: INSTALL_STATUS.md

Generated at end of first run and on `just setup report`. Human-readable. Committed to repo (gitignored if contains secrets — check first).

````markdown
# Install Status
_Generated: 2026-04-16 14:32_

## Project
- **Name:** my-saas
- **Domain:** my-saas.com
- **Agent:** claude (claude-sonnet-4-6)
- **Pricing:** none (Stripe skipped)

## Platform Status

| Platform | Status | Notes |
|----------|--------|-------|
| Supabase local | ✓ ready | Docker running |
| Supabase cloud | ✓ connected | project-ref: xyzabc |
| DNS | ↷ skipped | Configure manually |
| Stripe | ↷ skipped | Billing disabled |
| Firebase | ✗ failed | Invalid key — push broken |
| PostHog | ✓ connected | Session replay: off |

## What works without skipped steps

- ✓ Local development: fully functional
- ✓ Auth, DB, edge functions: working
- ✗ Billing / payments: disabled (Stripe skipped)
- ✗ Push notifications: broken (Firebase failed)
- ✓ Analytics: working (PostHog)
- ↷ Custom domain: not configured (DNS skipped)

## Next steps

1. Fix Firebase: run `just setup firebase`
2. Configure DNS: run `just setup dns`
3. Enable billing: run `just setup stripe` then `just setup pricing`
````

---

## Justfile integration

```makefile
setup:          # full install (first run: sequential, re-run: menu)
setup dns:      # run DNS step only
setup stripe:   # run Stripe step only
setup firebase: # run Firebase step only
setup health:   # run all checkers, print status table
setup report:   # regenerate INSTALL_STATUS.md
```
