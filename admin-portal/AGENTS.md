# admin-portal — AGENTS.md

Read ALL of these first, in order:
1. `/AGENTS.md` (root)
2. `architecture/frontend.md` ← base conventions for all frontend projects

Only differences from base conventions are listed here.

---

## Purpose

Internal admin + support webapp. Accessible at `admin.[domain]`.
Restricted to `admin` and `support` roles only. Redirect to login if neither.
PWA enabled.

## Auth

No self-register. Login only.
Dev login: `DevLogin` from commons (non-prod only) — shows admin + support seed users.

## Routes

| Path | Layout | Page | Roles |
|------|--------|------|-------|
| `/login` | AuthLayout | LoginPage | — |
| `/users` | AppLayout | UsersPage | admin, support |
| `/users/:id` | AppLayout | UserDetailPage | admin, support |
| `/plans` | AppLayout | PlansPage | admin — hidden if pricing_model: none |
| `/usage` | AppLayout | UsagePage | admin, support |
| `/support` | AppLayout | SupportPage | admin, support |
| `/system` | AppLayout | SystemPage | admin |

## Project-specific components

```
src/components/
  users/
    UserList.tsx               ← pageable, filterable
    UserDetail.tsx             ← full user view
    UserActions.tsx            ← delete (confirm by typing username), change plan
    TransactionHistory.tsx
    CreditBalance.tsx          ← pricing != none
    UsageStats.tsx             ← aggregated, multi-resolution
    DeviceList.tsx             ← platform, last_seen, first_seen
    MagicLinkPanel.tsx         ← generate + view link history
  plans/
    PlanList.tsx               ← hidden if pricing_model: none
    CouponManager.tsx
  usage/
    UsageDashboard.tsx         ← token counts, cost, by endpoint
  support/
    TicketList.tsx             ← email-client layout: list left, thread right
    ConversationView.tsx
    LlmSuggestReply.tsx        ← calls LLM, shows suggested replies as buttons
  system/
    DeploymentHistory.tsx      ← sha, branch, date, env, release notes
    TestPushButton.tsx         ← sends test push to selected user's devices
```

## User detail page sections (in order)

1. Profile (name, email, role, plan, created_at)
2. Magic Links (generate button + history table)
3. Devices (platform, last_seen, first_seen)
4. Credits + Transaction history (pricing != none)
5. Usage stats (multi-resolution: hourly/daily/monthly)
6. Support conversations
7. Danger zone (delete — must type username to confirm)

## Support page

Email-client layout:
- Left: conversation list with status filter (new/open/waiting/closed — closed hidden by default)
- Right: selected conversation thread
- Quicksearch bar for tickets + users
- LLM reply suggestions: load on conversation open, show as clickable buttons, fill textarea on click

## Billing visibility

Same pattern as client-portal — config check, hide not remove.
Plans page + user credits + transaction history hidden if `pricing_model: none`.
