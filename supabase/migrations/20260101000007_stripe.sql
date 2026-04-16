-- Migration: Stripe mirror tables (only apply if pricing_model != none)
-- Controlled by setup/pricing/setup_pricing.sh — run via: just setup-step pricing

create table public.stripe_customers (
  id                          uuid primary key references public.users(id) on delete cascade,
  stripe_customer_id          text unique not null,
  stripe_has_payment_method   bool not null default false,
  created_at                  timestamptz default now()
);

alter table public.stripe_customers enable row level security;

create policy "stripe_customers: own row read" on public.stripe_customers
  for select using (auth.uid() = id);

-- ────────────────────────────────────────────

create table public.stripe_subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_price_id       text not null,
  plan_slug             text not null,   -- 'free' | 'pro' | 'enterprise' | 'credits'
  status                text not null,   -- 'active' | 'canceled' | 'past_due'
  current_period_end    timestamptz,
  updated_at            timestamptz default now()
);

alter table public.stripe_subscriptions enable row level security;

create policy "stripe_subscriptions: own row read" on public.stripe_subscriptions
  for select using (auth.uid() = user_id);

-- ────────────────────────────────────────────

create table public.stripe_transactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.users(id) on delete set null,
  stripe_event_id  text unique not null,   -- idempotency key
  type             text not null,          -- 'credit_purchase' | 'subscription_payment' | ...
  amount_usd       numeric(10,4),
  credits_delta    integer,                -- positive = added, negative = deducted
  created_at       timestamptz default now()
);

alter table public.stripe_transactions enable row level security;

create policy "stripe_transactions: own rows read" on public.stripe_transactions
  for select using (auth.uid() = user_id);
