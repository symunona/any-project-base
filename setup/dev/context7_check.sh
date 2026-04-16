#!/bin/bash
# setup/dev/context7_check.sh
if command -v claude > /dev/null 2>&1 && claude mcp list 2>/dev/null | grep -q context7; then
  echo "OK"
else
  echo "SKIP context7 not configured (optional)"
  exit 1
fi
