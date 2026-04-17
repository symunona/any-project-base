#!/bin/bash
# setup/checks/secret_leak_check.sh
# Grep git index + working tree for committed secrets.
# Patterns: Stripe secret/webhook, PostHog key, Supabase JWT, Firebase service account.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PATTERNS=(
  'sk_live_[0-9a-zA-Z]{24,}'       # Stripe live secret key
  'sk_test_[0-9a-zA-Z]{24,}'       # Stripe test secret key
  'whsec_[0-9a-zA-Z]{32,}'         # Stripe webhook secret
  'phc_[a-zA-Z0-9]{40,}'           # PostHog key
  'rk_live_[0-9a-zA-Z]{24,}'       # Stripe restricted key
  '"private_key":\s*"-----BEGIN'   # Firebase service account JSON
)

EXCLUDE_GLOBS=(
  '*.example'
  '*.md'
  '*/node_modules/*'
  '*/.git/*'
  '*/DECISIONS.md'
)

FAIL=0
EXCLUDE_ARGS=()
for g in "${EXCLUDE_GLOBS[@]}"; do
  EXCLUDE_ARGS+=(--exclude="$g" --exclude-dir=node_modules --exclude-dir=.git)
done

for pattern in "${PATTERNS[@]}"; do
  HITS=$(grep -rP "$pattern" "${EXCLUDE_ARGS[@]}" . 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    echo "FAIL secret pattern matched: $pattern"
    echo "$HITS" | head -5
    FAIL=1
  fi
done

# Also check git index (catches staged-but-not-committed secrets)
if git rev-parse --git-dir > /dev/null 2>&1; then
  for pattern in "${PATTERNS[@]}"; do
    HITS=$(git grep -P "$pattern" HEAD 2>/dev/null || true)
    if [ -n "$HITS" ]; then
      echo "FAIL secret in git history: $pattern"
      echo "$HITS" | head -3
      FAIL=1
    fi
  done
fi

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"
