# Tooling Architecture

## Agent Selector

Agent choice is set once during `just setup` (init phase) and persisted in `project.yaml`. All setup scripts source `setup/lib/agent.sh` and use `run_agent()` — never call agents directly.

### Supported Agents

| Key | CLI | Notes |
|-----|-----|-------|
| `claude` | `claude` | Claude Code CLI, Anthropic |
| `codex` | `codex` | OpenAI Codex CLI |
| `gemini` | `gemini` | Google Gemini CLI |
| `aider` | `aider` | Aider (open source, multi-model) |
| `copilot` | `gh copilot suggest` | GitHub Copilot CLI |
| `echo` | `echo` | Dry run — prints prompt only, no agent called. Use to audit orchestration. |

### project.yaml

```yaml
agent: claude
agent_flags: "--model claude-sonnet-4-6"
```

Agent config lives in `project.yaml` (committed, no secrets). Not `.env` — this is tooling identity, not runtime config.

### setup/lib/agent.sh

Sourced by every setup script that needs agent calls.

```bash
#!/bin/bash
# setup/lib/agent.sh
# Source this file: source "$(dirname "$0")/../lib/agent.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_YAML="$SCRIPT_DIR/../../project.yaml"

AGENT_CMD=$(grep '^agent:' "$PROJECT_YAML" | awk '{print $2}')
AGENT_FLAGS=$(grep '^agent_flags:' "$PROJECT_YAML" | sed 's/agent_flags: //' | tr -d '"')

run_agent() {
  local prompt_file=$1
  if [ ! -f "$prompt_file" ]; then
    echo "ERROR: prompt file not found: $prompt_file"
    exit 1
  fi

  if [ "$AGENT_CMD" = "echo" ]; then
    echo "--- DRY RUN: would call agent with ---"
    cat "$prompt_file"
    echo "--------------------------------------"
    return 0
  fi

  $AGENT_CMD $AGENT_FLAGS -p "$(cat $prompt_file)"
}
```

### Usage in scripts

```bash
#!/bin/bash
source "$(dirname "$0")/../lib/agent.sh"

echo "Step 1: creating migration..."
run_agent "$(dirname "$0")/prompts/01_create_migration.md"

# verify step before continuing
if [ ! -f "supabase/migrations/$(date +%Y%m%d)*_stripe_tables.sql" ]; then
  echo "ERROR: migration not created. Check agent output above."
  exit 1
fi

echo "Step 2: wiring webhooks..."
run_agent "$(dirname "$0")/prompts/02_wire_webhooks.md"
```

### Prompt files

Each agent call = one `.md` file in the module's `prompts/` dir. Prompts are self-contained: include full context, exact file paths, exact schema. Agent has no guesswork.

```
setup/pricing/prompts/
  01_create_migration.md
  02_create_rls_policies.md
  03_wire_webhook_handler.md
  04_wire_ui_billing_page.md
```

### init script agent selection

`setup/init.sh` asks agent selection early:

```
Which agent will you use?
  1) claude    (Claude Code CLI)
  2) codex     (OpenAI Codex CLI)
  3) gemini    (Google Gemini CLI)
  4) aider     (Aider, open source)
  5) copilot   (GitHub Copilot CLI)
  6) echo      (dry run, print prompts only)
```

Writes choice to `project.yaml`. Can re-run `just setup agent` to change later.

---

## Script-first principle

Use pure shell wherever possible. Agent calls only when:
- Generating code that requires reasoning about project structure
- Writing migrations with non-trivial logic
- Wiring multi-file changes

Prefer script for: CLI calls (Stripe, Supabase), env file writes, file existence checks, table output.
