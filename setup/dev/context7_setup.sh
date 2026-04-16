#!/bin/bash
# setup/dev/context7_setup.sh — Context7 MCP server for up-to-date docs
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"

header "CONTEXT7 MCP"
info "MCP server: injects live library docs into agent context."
info "Prevents hallucinated APIs — agent sees real current docs."
echo ""

if confirm "Configure Context7 MCP for Claude Code?"; then
  if command -v claude > /dev/null 2>&1; then
    claude mcp add context7 -- npx -y @upstash/context7-mcp 2>/dev/null && \
      success "Context7 MCP configured" || \
      warn "Failed — add manually: claude mcp add context7 -- npx -y @upstash/context7-mcp"
  else
    warn "claude CLI not found — add Context7 after claude is installed:"
    arrow "claude mcp add context7 -- npx -y @upstash/context7-mcp"
  fi
else
  skip "Skipping Context7."
fi
