# Wire billing UI

## Context

- Pricing model: `{{PRICING_MODEL}}`
- client-portal billing page: `client-portal/src/pages/settings/BillingPage.tsx` (currently returns null if pricing=none)
- admin-portal plans page: `admin-portal/src/pages/PlansPage.tsx`
- commons types: `commons/types/project.types.ts`
- commons API client: `commons/api/client.ts`

## Task

Update billing pages for pricing model `{{PRICING_MODEL}}`:

### client-portal/src/pages/settings/BillingPage.tsx
- If subscription: show current plan, next billing date, cancel button
- If credits: show balance, "Buy more" CTA, transaction history
- If credits+subscription: show both plan info and credit balance
- Use `fetchApi` for all HTTP (never raw fetch)
- All colors via `var(--color-*)` CSS vars

### admin-portal/src/pages/PlansPage.tsx
- Show all users with subscriptions and credit balances
- Allow manual credit adjustment (admin only)

## Rules

- No Stripe.js on the frontend — redirect to Stripe Checkout via edge function
- `BillingPage` returns null if `config.pricingModel === 'none'` (keep this guard)
- Use DataTable component from commons for lists
- fetchApi throws ApiError on non-ok — handle 402 (insufficient credits) specially
