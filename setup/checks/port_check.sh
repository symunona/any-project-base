#!/bin/bash
# setup/checks/port_check.sh — check all dev ports are free
# Exit 0: all free. Exit 1: one or more busy.
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

PORTS=(
  "54321:Supabase API"
  "54322:Supabase DB"
  "54323:Supabase Studio"
  "54324:Supabase Inbucket"
  "6173:client-portal"
  "6174:admin-portal"
  "6175:landing"
)

ALL_FREE=1
for entry in "${PORTS[@]}"; do
  PORT="${entry%%:*}"
  NAME="${entry##*:}"
  if lsof -ti:"$PORT" &>/dev/null 2>&1; then
    fail "$PORT  $NAME — busy"
    ALL_FREE=0
  else
    success "$PORT  $NAME"
  fi
done

[ $ALL_FREE -eq 1 ]
