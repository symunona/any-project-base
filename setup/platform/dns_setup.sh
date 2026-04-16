#!/bin/bash
# setup/platform/dns_setup.sh — DNS configuration walkthrough
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

header "DNS SETUP"
info "Configure domain DNS for your project."
info "Points root domain and subdomains to your hosting."
warn "Without this: app reachable only by IP / provider URLs."
echo ""
info "Subdomains to configure:"
arrow "api.[domain]       → Supabase edge functions"
arrow "app.[domain]       → client-portal"
arrow "admin.[domain]     → admin-portal"
arrow "[domain]           → landing page"
echo ""

prompt_input "Domain name (e.g. my-saas.com)" DOMAIN || { skip "Skipping DNS setup."; write_state "dns" "skipped" "user skipped"; exit 0; }

write_yaml "domain" "$DOMAIN"

echo ""
info "DNS records to add at your registrar:"
echo ""
printf "  %-35s %-8s %-s\n" "NAME" "TYPE" "VALUE"
divider
printf "  %-35s %-8s %-s\n" "$DOMAIN" "A/CNAME" "(your hosting IP or CNAME)"
printf "  %-35s %-8s %-s\n" "app.$DOMAIN" "CNAME" "(client-portal URL)"
printf "  %-35s %-8s %-s\n" "admin.$DOMAIN" "CNAME" "(admin-portal URL)"
printf "  %-35s %-8s %-s\n" "api.$DOMAIN" "CNAME" "(Supabase project URL)"
echo ""
warn "DNS propagation: up to 48h. Check: dig +short $DOMAIN"
echo ""

if confirm "Mark DNS as configured?"; then
  success "DNS marked as configured."
  write_state "dns" "ok" "$DOMAIN"
else
  skip "DNS setup deferred. Run: just setup dns when ready."
  write_state "dns" "skipped" "deferred"
fi
