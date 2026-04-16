# Create Stripe billing migration

Add Stripe billing tables to the database.

## Context

- Project: any-project-base
- Supabase migrations: `supabase/migrations/`
- Existing tables: `public.users`, `devices`, `support_conversations`, `usage`, `credits`
- Pricing model: `{{PRICING_MODEL}}` (credits | subscription | credits+subscription)

## Task

Create migration file: `supabase/migrations/TIMESTAMP_billing_stripe.sql`

Include:
1. `stripe_customers` table (user_id FK, stripe_customer_id, created_at)
2. `stripe_subscriptions` table (user_id FK, stripe_subscription_id, status, plan_id, current_period_end, created_at)
3. `stripe_transactions` table (user_id FK, stripe_payment_intent_id, amount_cents, currency, status, created_at)
4. RLS: users can read their own rows. No insert/update from frontend (service role only).
5. Index on user_id for all three tables.
6. If pricing_model includes 'credits': ensure credits table has atomic deduction comment.

## Rules

- Use `supabase gen migration` naming: `YYYYMMDD000000_billing_stripe.sql`
- All tables in `public` schema
- RLS enabled on all tables
- Service role insert policies (not anon)
- Include `created_at TIMESTAMPTZ DEFAULT now()` on all tables
