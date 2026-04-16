# Wire Stripe webhook handler

## Context

- Edge function: `supabase/functions/stripe-webhook/index.ts` (exists — has HMAC verification scaffold)
- Stripe events to handle: `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`, `payment_intent.succeeded`
- Shared auth: `supabase/functions/_shared/auth.ts`
- DB client: `supabase/functions/_shared/db.ts` (service role)

## Task

Complete `supabase/functions/stripe-webhook/index.ts`:

1. HMAC signature verification using `STRIPE_WEBHOOK_SECRET` env var (already scaffolded — verify it's correct)
2. Parse event type, dispatch to handler
3. `customer.subscription.created/updated`: upsert `stripe_subscriptions`
4. `customer.subscription.deleted`: update status to 'canceled'
5. `invoice.payment_succeeded`: insert `stripe_transactions`, update subscription if needed
6. `invoice.payment_failed`: log to `stripe_transactions` with status 'failed'
7. Idempotency: check `stripe_event_id` before processing — skip if already seen

## Rules

- Never use Stripe SDK (Deno runtime — use raw API calls or manual HMAC)
- All DB ops via service role client from `_shared/db.ts`
- Return 200 even on handled errors (Stripe retries on non-2xx)
- Return 400 only for signature verification failures
