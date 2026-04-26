# AGENTS.md — Root

Read this before touching anything in this repo.
Read the AGENTS.md in each subfolder before touching that module.

---

## What this repo is

Opinionated SaaS monorepo starter. Every architectural decision is documented in `architecture/`.
Before implementing anything non-trivial: read the relevant architecture doc.

## Architecture docs (read when relevant)

| Doc | When to read |
|-----|-------------|
| `architecture/philosophy.md` | always — core principles |
| `architecture/frontend.md` | any frontend work |
| `architecture/auth.md` | any auth-related work |
| `architecture/pricing.md` | any billing/credits/stripe work |
| `architecture/paging.md` | any list endpoint or data table |
| `architecture/complexity.md` | before writing complex functions |
| `architecture/branding.md` | any visual/color/logo work |
| `architecture/tooling.md` | agent selector, run_agent(), setup scripts |
| `architecture/setup-ux.md` | any setup script work |
| `architecture/mobile.md` | any mobile-app work |
| `architecture/project-yaml.md` | reading/writing project.yaml |

## Local setup

See `SETUP.md` for prerequisites, env setup, and how to start the stack.

## justfile is the interface

All dev tasks live in `justfile`. Never instruct a dev (or agent) to run raw CLI commands (`supabase`, `pnpm`, `expo`, etc.) when a `just` target exists or should exist.

- Need to start something? → `just start` / `just dev` / `just mobile-dev`
- Need to run a check? → `just check` / `just check-db` / `just check-frontend`
- Need to deploy? → `just deploy <env>`
- Missing a task? → add it to `justfile` first, then use it

If a raw CLI invocation is needed that has no `just` wrapper yet, add the wrapper before using it. `just` is the contract between devs, agents, and CI.

## Finding the running server URL

Before browsing or testing, resolve the live URL for this environment:

**1. VPS — check which nginx mode is configured:**

Two modes coexist independently. Check whichever config file is present:

| Config file | Mode | Domain pattern | How to set up |
|-------------|------|----------------|---------------|
| `setup/dev/.vitedev-config` | **Dev proxy** — nginx → Vite dev servers | `portal.dev.{project}.{domain}` | `just setup-nginx-localdev` |
| `setup/dev/.localdev-config` | **Service** — nginx → built `dist/` | `portal.{project}.{domain}` | `just setup-service-localdev` |

Both files expose `URL_PORTAL`, `URL_ADMIN`, `URL_LANDING`, `URL_API`.

After `just start` (Vite running) → use `URL_PORTAL` from `.vitedev-config`.
After `just deploy-local-service` (built files) → use `URL_PORTAL` from `.localdev-config`.

**2. Otherwise derive from `project.yaml`** (local Caddy dev):
```bash
grep '^name:' project.yaml   # → e.g. "any-project-base"
```
Caddy routes:
- Landing → `http://{name}.localhost:5175`
- Client portal → `http://portal.{name}.localhost` (proxied from :5173)
- Admin portal → `http://admin.{name}.localhost` (proxied from :5174)

**3. Check if the server is actually running before testing:**
```bash
just local-service-status
```
This shows Supabase, Caddy, all three Vite ports, and the systemd service state. If servers are stopped, the browser check will show nothing useful — start them first (`just start`).

## Always verify with agent-browser

After any UI change or deployment, use an agent with browser access to check the result:
- Browse to the resolved URL
- Report what's visible: any blank screen, error overlay, console errors, or working UI
- Never report a UI task as complete without a browser verification

## Before every task

```bash
git log --oneline -30     # understand recent context
git status                # start with clean worktree — handle uncommitted files first
```

Read the AGENTS.md in the subfolder you're working in.

## Coding rules

- Anonymous contributor — no AI attribution anywhere
- No "Co-Authored-By" in commits
- Never edit GENERATED files — see generated files table in `Any Project Base.md`
- Always run checkers after changes: `just check`
- If complexity ≥ 8: create/update `@docs:` file before committing

## Planning rules

- Classify if changes are architectural — if yes, STOP and ask the dev
- End every plan with assessment table: architectural change | complexity | certainty | impact
- Happy path first — no speculative error handling

## Scripting language policy

| Use | Language |
|-----|----------|
| Install scripts, CLI wrappers, pattern greps | **Bash** |
| Logic that imports project code, diffs schemas, or crosses module boundaries | **TS** (run with `tsx`) |

Rule: if the script would be clearer or more correct by importing a real type or schema, use TS. If it's just calling CLIs or grepping strings, bash is fine. Never rewrite a working bash script to TS just for consistency.

## Generated files

See `Any Project Base.md` → "Generated files convention" for full table and rules.
Never edit files with `GENERATED —` header comment.

## Supply chain security

| Command | What it does |
|---------|-------------|
| `just security-audit` | Clean summary: pnpm audit counts + high/critical detail + glassworm scan |
| `just security-autofix` | Auto-fix patchable vulns: bumps direct deps (non-major only), adds `pnpm.overrides` for transitive |

**Autofix rules:**
- Direct deps: bumps version in `package.json` only if patched version is same major (no breaking change)
- Transitive deps: adds/updates `pnpm.overrides` in `package.json`
- Skips anything requiring a major version bump — those need manual review
- Always runs `pnpm install` after patching

**Scripts:** `setup/checks/supply_chain_audit.sh`, `setup/checks/supply_chain_autofix.sh`

**glassworm-hunter** must be installed: `pip3 install glassworm-hunter --break-system-packages`

## Recommended Claude Code plugins

Install once per dev machine: `just plugin-install`

| Plugin | What it adds | How installed |
|--------|-------------|---------------|
| `context7` | Up-to-date library docs pulled into context on demand | via `just plugin-install` — MCP server, auto-active (`.mcp.json` in repo root) |
| `caveman` | Terse response mode — cuts filler, keeps technical substance | via `just plugin-install` — use `/caveman` to activate |

`context7` is **MCP-based** — no activation needed, just use `use context7` in a prompt and it fetches live docs for any library. The `.mcp.json` in this repo root wires it up automatically when Claude Code opens this project.

`caveman` is a **skill** — persistent across the session once activated. Recommended for experienced devs who want shorter responses.

To add more: `claude plugin install <name>` or `claude plugin search`.

## Module map

| Dir | Purpose |
|-----|---------|
| `supabase/` | DB, auth, edge functions |
| `client-portal/` | user-facing React PWA |
| `admin-portal/` | admin/support React PWA |
| `landing/` | static multilang landing page |
| `mobile-app/` | Expo React Native app |
| `commons/` | shared types, hooks, components, utils |
| `architecture/` | architectural decisions — read-only for agents |
| `setup/` | install + platform setup scripts |
| `branding/` | logos, colors — edit here, propagate via `just setup-apply-branding` |
| `spec/` | module specs |

## Misc
For temporary images like screenshots and agent-browser outputs, use tmp/ folder. 