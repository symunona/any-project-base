-- Migration: credits balance (pricing: credits | subscription_credits)
-- Controlled by setup/pricing/setup_pricing.sh

create table public.credits (
  user_id    uuid primary key references public.users(id) on delete cascade,
  balance    integer not null default 0,
  updated_at timestamptz default now()
);

alter table public.credits enable row level security;

create policy "credits: own row read" on public.credits
  for select using (auth.uid() = user_id);

-- Deduct atomically (edge function, service role):
-- UPDATE credits SET balance = balance - $n WHERE user_id = $id AND balance >= $n
-- 0 rows updated = insufficient credits, reject call
