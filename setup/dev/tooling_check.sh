#!/bin/bash
# setup/dev/tooling_check.sh
MISSING=()

command -v pnpm > /dev/null 2>&1 || MISSING+=("pnpm")
command -v docker > /dev/null 2>&1 || MISSING+=("docker")
command -v just > /dev/null 2>&1 || MISSING+=("just")
command -v supabase > /dev/null 2>&1 || MISSING+=("supabase CLI")

NODE_VERSION=$(node --version 2>/dev/null | tr -d 'v' | cut -d. -f1)
[ "${NODE_VERSION:-0}" -lt 20 ] && MISSING+=("node>=20")

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "FAIL missing: ${MISSING[*]}"
  exit 1
fi

echo "OK"
