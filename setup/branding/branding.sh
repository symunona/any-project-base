#!/bin/bash
# setup/branding/branding.sh — step 3: generate palette + logos via agent
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"
source "$SETUP_DIR/lib/agent.sh"

header "BRANDING"
info "Describe your product and target audience."
info "Agent generates 5 color palettes + SVG logos."
info "You choose one — saved to branding/."
echo ""
warn "Requires: agent configured (step 1)."
echo ""

prompt_input "Business description (1-3 sentences)" BIZ_DESC || { skip "Skipping branding."; write_state "branding" "skipped"; exit 0; }
prompt_input "Target audience" TARGET_AUDIENCE || TARGET_AUDIENCE="general"
prompt_input "Mood / style keywords (e.g. minimal, bold, friendly)" MOOD || MOOD="modern, clean"

# Write description into prompt template
PROMPT_FILE="$SETUP_DIR/branding/prompts/01_generate_palette.md"
TMP_PROMPT=$(mktemp)
sed \
  -e "s/{{BUSINESS_DESCRIPTION}}/$BIZ_DESC/g" \
  -e "s/{{TARGET_AUDIENCE}}/$TARGET_AUDIENCE/g" \
  -e "s/{{MOOD}}/$MOOD/g" \
  "$PROMPT_FILE" > "$TMP_PROMPT"

echo ""
info "Calling agent to generate palette options..."
run_agent "$TMP_PROMPT"
rm -f "$TMP_PROMPT"

# Verify palette.js was generated
PALETTE_FILE="$(dirname "$0")/palette.js"
if [ ! -f "$PALETTE_FILE" ]; then
  warn "palette.js not found. Check agent output above."
  warn "Re-run: just setup branding"
  write_state "branding" "fail" "palette.js missing"
  exit 1
fi

success "Palette generated: $PALETTE_FILE"
info "Preview: open branding/palette-template.html in browser."
echo ""

if confirm "Apply branding to all targets now?"; then
  bash "$(dirname "$0")/apply-branding.sh"
fi

write_state "branding" "ok"
