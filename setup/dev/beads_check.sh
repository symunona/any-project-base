#!/bin/bash
# setup/dev/beads_check.sh
if command -v beads > /dev/null 2>&1; then
  echo "OK"
else
  echo "SKIP beads not installed (optional)"
  exit 1
fi
