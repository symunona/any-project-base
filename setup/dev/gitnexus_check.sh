#!/bin/bash
# setup/dev/gitnexus_check.sh
if command -v gitnexus > /dev/null 2>&1; then
  echo "OK"
else
  echo "SKIP gitnexus not installed (optional)"
  exit 1
fi
