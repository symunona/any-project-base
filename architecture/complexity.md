# Complexity Architecture

See architecture/philosophy.md — complexity enforcement is a checker-first guardrail.

## Thresholds

| Score | Action |
|-------|--------|
| < 8 | nothing |
| 8–10 | generate/update doc file, blocking pre-commit |
| 11–15 | doc + warn dev in commit output |
| > 15 | CI hard fail — must refactor before merge |

## Tool

`code-complexity` CLI — per-function cyclomatic complexity, TS-native, JSON output, threshold flags.

Run: `setup/checks/complexity_check.sh` — per module, compares against baseline in `architecture/complexity-baseline.json`. Updated on merge to main.

## @docs: convention

Any function at complexity ≥ 8 gets a doc file generated next to it.

**In source file — first line:**
```typescript
// @docs: stripe-webhook.docs.md
export async function handleStripeWebhook(req) { ... }
```

**Doc file format:**
```markdown
# handleStripeWebhook

## Complexity: 12 — last updated 2026-04-16

## Current logic (2026-04-16)

[mermaid flowchart]

[plain english explanation of the logic]

---

## History

### 2026-03-01 — complexity: 7
[previous mermaid + explanation — never delete, always preserve]
```

## Checker behavior

On every commit:
1. Scan changed files for `// @docs:` comment
2. If file changed + has `@docs:` ref → flag doc file for revision
3. If no doc file exists yet → create it
4. Agent prompt fired (blocking): "this file changed, revise its doc. Add new entry on top with today's date and current complexity score. Preserve all history below unchanged."
5. If complexity crossed threshold boundary → include score + mermaid requirement in prompt
6. Commit blocked until doc file updated in same commit

## Agent output example

```
COMPLEXITY: src/billing/stripe-webhook.ts::handleStripeWebhook
  score: 14  threshold: 15  status: WARNING
  @docs file: src/billing/stripe-webhook.docs.md
  ACTION REQUIRED: update doc file before commit passes.
```

## Baseline tracking

`architecture/complexity-baseline.json` — stores per-function scores at last main merge.
Delta tracked: regression flagged even if absolute score is under threshold.

```json
{
  "src/billing/stripe-webhook.ts::handleStripeWebhook": 12,
  "src/auth/session.ts::validateSession": 8
}
```
