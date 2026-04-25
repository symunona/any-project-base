# any-project-base

Opinionated SaaS monorepo starter. Kick-starts any business idea — demo-ready and deployable in the shortest time possible.

## Quick start

See **[SETUP.md](SETUP.md)** for full local setup steps.

```bash
just install      # install dependencies
supabase start    # start local DB + auth (Docker required)
just db-reset     # apply migrations + seed
just dev          # start all services
```

## What's included

| Module | Purpose |
|--------|---------|
| `client-portal/` | React PWA for end users |
| `admin-portal/` | React PWA for admins + support |
| `landing/` | Static multilingual landing page |
| `mobile-app/` | Expo (React Native) app |
| `supabase/` | PostgreSQL, Auth, edge functions |
| `commons/` | Shared types, hooks, components |
| `setup/` | Install + platform setup scripts |
| `branding/` | Logos, colors — source of truth |
| `architecture/` | All architectural decisions |

## Docs

- `AGENTS.md` — read before any task
- `architecture/` — read the relevant doc before touching a module
- `Any Project Base.md` — full spec + decisions

## Licence

MIT
