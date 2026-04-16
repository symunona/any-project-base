# Pricing Architecture

## Pricing Models

Selected once during `just setup`. Written to `project.yaml` as `pricing_model`. Controls: which Stripe products are created, which UI sections render, which DB migrations run.

```yaml
pricing_model: credits  # none | credits | subscription_credits | tiers
```

### none
No billing. No Stripe. No credits. Billing UI sections hidden.

`project.yaml: pricing_model: none` set during init. Setup script detects this and runs `setup/pricing/remove_billing.sh` — agent-driven removal of all billing references (see "Removing billing" below). If user skips pricing selection during setup, defaults to `none` and removal runs automatically.

### credits
Users buy credit packs (one-time purchases). No subscription. Credits deducted per LLM call.

Stripe objects created:
- 1 Product: "Credits"
- N Prices: e.g. 100 credits / $5, 500 credits / $20, 2000 credits / $75

### subscription_credits
Monthly subscription includes X credits. Users can top up with additional packs.

Stripe objects created:
- 1 Product: "Subscription" with monthly Price
- 1 Product: "Credits" with top-up Prices (same as above)

### tiers
Free / Pro / Enterprise. Feature-gated. No explicit credit balance.

Stripe objects created:
- 3 Products: Free (free Price), Pro (monthly Price), Enterprise (monthly Price)

---

## DB Tables (stripe-prefixed)

All Stripe-related tables prefixed `stripe_`. Local mirror of Stripe state — kept in sync via webhooks. Read from DB, write from webhooks only.

```sql
-- mirrors stripe Customer
stripe_customers (
  id uuid PRIMARY KEY REFERENCES public.users(id),
  stripe_customer_id text UNIQUE NOT NULL,
  stripe_has_payment_method bool DEFAULT false,
  created_at timestamptz DEFAULT now()
)

-- mirrors active subscription (null if none)
stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_price_id text NOT NULL,
  plan_slug text NOT NULL,  -- 'free' | 'pro' | 'enterprise' | 'credits'
  status text NOT NULL,     -- 'active' | 'canceled' | 'past_due'
  current_period_end timestamptz,
  updated_at timestamptz DEFAULT now()
)

-- credit balance per user (credits model only)
credits (
  user_id uuid PRIMARY KEY REFERENCES public.users(id),
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
)

-- transaction log (all stripe events that affect user)
stripe_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  stripe_event_id text UNIQUE NOT NULL,  -- idempotency
  type text NOT NULL,                     -- 'credit_purchase' | 'subscription_payment' | ...
  amount_usd numeric(10,4),
  credits_delta integer,                  -- positive = added, negative = deducted
  created_at timestamptz DEFAULT now()
)
```

---

## Credits & LLM Usage

Every LLM/AI call creates a `usage` row. Credits deducted atomically with usage insert.

```sql
usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  model text NOT NULL,           -- 'claude-sonnet-4-6', 'gpt-4o', etc.
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(10,6),        -- actual API cost
  credits_used integer,          -- your markup applied here
  endpoint text,                 -- which feature triggered this
  created_at timestamptz DEFAULT now()
)
```

Credit deduction on each call:
```sql
UPDATE credits SET balance = balance - $credits_used WHERE user_id = $user_id AND balance >= $credits_used
-- if 0 rows updated: insufficient credits, reject call
```

---

## Webhook Sync

Stripe → your `/api/webhooks/stripe` edge function → verify signature → update DB.

Key events to handle:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | top up credits or activate subscription |
| `customer.subscription.updated` | update `stripe_subscriptions.status` |
| `customer.subscription.deleted` | mark canceled, downgrade user |
| `invoice.paid` | insert `stripe_transactions` row |
| `invoice.payment_failed` | flag account, email user |

All handlers idempotent via `stripe_event_id` unique constraint.

Local dev: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`

---

## Stripe Setup Script

`setup/pricing/setup_pricing.sh` — orchestrates Stripe CLI calls + agent prompts in order.

```
setup/pricing/
  setup_pricing.sh          # orchestrator
  check_pricing.sh          # verifies all Stripe objects + DB tables exist
  prompts/
    01_create_migration.md  # agent: create stripe_* tables migration
    02_create_rls.md        # agent: RLS policies for stripe tables
    03_webhook_handler.md   # agent: edge function for webhook
    04_wire_ui.md           # agent: wire billing UI to pricing_model
```

Script flow:
1. Read `pricing_model` from `project.yaml`
2. If `none`: print agent instruction, exit
3. Run `stripe products create ...` for chosen template (pure CLI, no agent)
4. Write Stripe IDs to `.env.local`
5. Call agent prompts in order, verify each output before next step

---

## Removing Billing (pricing_model: none)

Agent instruction — run this prompt with your agent:

> Remove all billing functionality from this project. pricing_model is 'none' in project.yaml.
> Remove:
> - Nav items: "Plan/Billing" from client-portal header, "Plans", "Usage" from admin-portal header
> - Routes: `/billing`, `/plans`, `/admin/plans`, `/admin/usage`
> - Components: `BillingPage`, `PlansPage`, `CreditsDisplay`, `UsagePage`
> - DB migrations: skip any file prefixed `stripe_` or `credits`
> - Env vars: remove all `STRIPE_*` vars from `.env.local.example`
> - Setup: skip `setup/pricing/setup_pricing.sh`
> Do NOT remove: `usage` table (keep for internal analytics even without billing).

---

## UI by Pricing Model

| Section | none | credits | subscription_credits | tiers |
|---------|------|---------|---------------------|-------|
| Client: Plan/Billing page | hidden | credit balance + buy packs | plan + top-up | plan comparison |
| Client: transaction history | hidden | shown | shown | shown |
| Admin: Plans page | hidden | credit packs mgmt | plan + pack mgmt | tier mgmt |
| Admin: Usage page | shown | shown | shown | shown |
| Admin: User credits col | hidden | shown | shown | hidden |
