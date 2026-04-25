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
| `branding/` | logos, colors — edit here, propagate via apply-branding |
| `spec/` | module specs |
