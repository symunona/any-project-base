-- Migration: usage (LLM call tracking)

create table public.usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  model         text not null,
  input_tokens  integer,
  output_tokens integer,
  cost_usd      numeric(10,6),
  credits_used  integer,
  endpoint      text,
  created_at    timestamptz default now()
);

alter table public.usage enable row level security;

-- Users can read their own usage
create policy "usage: own rows read" on public.usage
  for select using (auth.uid() = user_id);

-- Only service role can insert (edge functions use service key)
create policy "usage: service insert" on public.usage
  for insert with check (false);  -- bypassed by service role key
