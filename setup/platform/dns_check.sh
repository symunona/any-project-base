#!/bin/bash
# setup/platform/dns_check.sh — verify DNS records
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/yaml.sh"

DOMAIN=$(read_yaml "domain")

if [ -z "$DOMAIN" ]; then
  echo "SKIP domain not configured in project.yaml"
  exit 1
fi

# Check if domain resolves
if ! dig +short "$DOMAIN" | grep -q .; then
  echo "FAIL $DOMAIN does not resolve"
  exit 1
fi

echo "OK"
