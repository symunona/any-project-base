# Project Philosophy

## Agent writes cheap. Maintain proper tooling

AI agent calls are cheap. Bad state in production is not. Every architectural decision must answer two questions:

1. How could this go wrong?
2. How do we guard against it — WITHOUT an agent?

The answer is always a checker script.

## Checker-first thinking

When making any decision:
- Drift between two sources of truth? → checker that diffs them, fails loudly
- Color used outside palette? → checker that scans CSS
- Raw fetch() called directly? → checker that greps for it
- Untranslated string? → checker that finds unresolved keys
- Supply chain attack? → GlassWorm on every install
- Schema mismatch? → checker that compares Zod shapes

Checkers are shell scripts. They are fast, deterministic, agent-agnostic. They run:
- Pre-commit (git hook)
- In CI (block merge)
- Post-deploy (verify production state)
- During setup (verify each step landed)

## Failure is a signal, not a disaster

When a checker fails, agent gets the exact output as input. It rewrites. Cheap.
Checker failure in CI = never reaches production. That's the guarantee.

Do not use agents to guard quality. Use agents to write code.
Use scripts to guard quality.

## Implications

- Writing a checker IS part of implementing a feature. Not optional.
- Every architecture doc must include: "What checker enforces this?"
- Prefer simple, strict checks over flexible, forgiving ones. Fail loud.
- Checkers should output actionable messages: what failed, where, what to fix.
- A checker that always passes is worthless. Test that it fails when it should.

## On drift specifically

Two sources of truth that can drift = a checker that diffs them on every commit.
Drift in dev = cheap fix. Drift in production = bug. Checker is the wall between them.

Example: frontend Zod schemas vs edge function Zod schemas.
They are written separately (simpler architecture). Checker diffs them.
If they drift: CI fails, agent gets diff output, rewrites. Never ships.

## Third-party services must be wrapped

Never reference a third-party service SDK directly in application code.
Always wrap behind a thin interface in `commons/lib/`. The interface is the contract — the provider is an implementation detail.

```typescript
// correct — app code sees only the interface
import { analytics } from '@any-project-base/commons'
analytics.track('user_signed_up')

// wrong — hard dependency, scattered, painful to replace
import posthog from 'posthog-js'
posthog.capture('user_signed_up')
```

**Applies to:** analytics, error monitoring, email, push notifications, payments, storage, AI/LLM clients.

**Wrapper lives in:** `commons/lib/[service-name].ts`
**Interface defined first**, implementation wired inside.
Swapping provider = change one file, zero application code changes.

Checker: grep for direct SDK imports (`posthog-js`, `@sentry/react`, `stripe`, `firebase`) outside `commons/lib/` — CI fail.

## Cost model

| Action | Cost |
|--------|------|
| Agent writes code | cheap |
| Agent rewrites on checker signal | cheap |
| Bug reaches production | expensive |
| Writing a checker script | cheap |
| Maintaining a checker | near-zero |
| Skipping a checker "just this once" | expensive (eventually) |
