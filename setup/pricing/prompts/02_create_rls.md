# Create RLS policies for billing tables

## Context

Migration file was just created in `supabase/migrations/`. Now add correct RLS policies.

## Task

Review the migration and verify:

1. `stripe_customers`: user can SELECT where `user_id = auth.uid()`. No frontend insert.
2. `stripe_subscriptions`: user can SELECT their own. No frontend insert.
3. `stripe_transactions`: user can SELECT their own. No frontend insert.
4. All INSERT/UPDATE done via service role key only (from edge functions).

If any policy is wrong, write a follow-up migration to fix it:
`supabase/migrations/TIMESTAMP_billing_rls_fix.sql`

## Rules

- Never allow anon INSERT/UPDATE on billing tables
- Never expose `stripe_customer_id` to anon users
- Keep policies minimal: read-own is the maximum client permission
