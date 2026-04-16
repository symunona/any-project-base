#!/bin/bash
# setup/init/project.sh — step 2: project identity
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

header "PROJECT INIT"
info "Basic project identity. Stored in project.yaml."
info "Used across scaffolds, manifests, and deploy scripts."
echo ""

prompt_input "Project name (slug, e.g. my-saas)" PROJECT_NAME || { skip "Skipping project init."; write_state "project" "skipped"; exit 0; }
prompt_input "Display name (e.g. My SaaS)" PROJECT_DISPLAY_NAME || PROJECT_DISPLAY_NAME="$PROJECT_NAME"
prompt_input "Domain (e.g. my-saas.com)" PROJECT_DOMAIN || PROJECT_DOMAIN=""
prompt_input "Tagline (one sentence)" PROJECT_TAGLINE || PROJECT_TAGLINE=""
prompt_input "Git URL (optional)" PROJECT_GIT_URL || PROJECT_GIT_URL=""
prompt_input "Default locale (e.g. en)" PROJECT_LOCALE || PROJECT_LOCALE="en"

echo ""
info "Supported locales (comma-separated, e.g. en,es,ko):"
prompt_input "Supported locales" PROJECT_LOCALES || PROJECT_LOCALES="$PROJECT_LOCALE"

write_yaml "name" "$PROJECT_NAME"
write_yaml "display_name" "\"$PROJECT_DISPLAY_NAME\""
write_yaml "domain" "$PROJECT_DOMAIN"
write_yaml "tagline" "\"$PROJECT_TAGLINE\""
write_yaml "git_url" "$PROJECT_GIT_URL"
write_yaml "default_locale" "$PROJECT_LOCALE"
write_yaml "supported_locales" "[$PROJECT_LOCALES]"

echo ""
success "project.yaml updated."
write_state "project" "ok"
