-- Migration: magic_links (admin-generated client login links)

create table public.magic_links (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  generated_by uuid references public.users(id) on delete set null,
  token_hash   text not null,
  clicked_at   timestamptz,    -- null = not yet used; set on first click = dead
  expires_at   timestamptz not null,
  created_at   timestamptz default now()
);

alter table public.magic_links enable row level security;

-- Only service role reads/writes (admin portal uses service key)
create policy "magic_links: no anon access" on public.magic_links
  for all using (false);
