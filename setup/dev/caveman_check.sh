#!/bin/bash
# setup/dev/caveman_check.sh
if command -v claude > /dev/null 2>&1 && claude plugin list 2>/dev/null | grep -q caveman; then
  echo "OK"
else
  echo "SKIP caveman not installed (optional)"
  exit 1
fi
