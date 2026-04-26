# any-project-base

Opinionated SaaS monorepo starter. Kick-starts any business idea — demo-ready and deployable in the shortest time possible.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/symunona/any-project-base/main/setup/bootstrap.sh | bash
```

_Installs prerequisites (node, pnpm, just), clones the template, and optionally launches the guided setup wizard._

## How it works

Clone the repo (or let bootstrap do it), then run `just setup` to walk through the guided wizard — it writes `project.yaml`, generates `.env` files, and wires up external platforms. Configure Supabase (DB + Auth), Stripe (billing), and any other integrations via the wizard's prompts. Once everything is configured, `just dev` starts all services concurrently and you're in a running local stack.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend apps | React (Vite), TypeScript, Tailwind CSS |
| Mobile | Expo (React Native), TypeScript |
| Backend / DB | Supabase — Postgres, Auth, Edge Functions |
| Billing | Stripe |
| Shared code | pnpm workspaces, `commons/` package |
| Local infra | Docker (Supabase local), Caddy (dev routing) |
| Task runner | `just` (justfile) |

## Quick start

See **[SETUP.md](SETUP.md)** for full local setup steps.

```bash
just install      # install dependencies
just start        # start local DB + auth (Docker required)
just db-reset     # apply migrations + seed
just dev          # start all services
```

## What's included

| Module | Purpose | Key tech |
|--------|---------|----------|
| `client-portal/` | React PWA for end users | React, Vite, Tailwind, Supabase JS |
| `admin-portal/` | React PWA for admins + support | React, Vite, Tailwind, Supabase JS |
| `landing/` | Static multilingual landing page | React, Vite, i18n |
| `mobile-app/` | Expo (React Native) app | Expo, React Native, TypeScript |
| `supabase/` | PostgreSQL, Auth, edge functions | Supabase, Postgres, Deno |
| `commons/` | Shared types, hooks, components | TypeScript, pnpm workspace |
| `setup/` | Install + platform setup scripts | Bash, Node, `just` |
| `branding/` | Logos, colors — source of truth | SVG, design tokens |
| `architecture/` | All architectural decisions | Markdown docs |

## Docs

- `AGENTS.md` — read before any task
- `architecture/` — read the relevant doc before touching a module
- `Any Project Base.md` — full spec + decisions
- `SETUP.md` — prerequisites and local setup walkthrough

## Licence

MIT
