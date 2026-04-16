-- Migration: devices (push notification tokens)

create table public.devices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  token       text not null,
  platform    text not null,
  last_seen   timestamptz default now(),
  created_at  timestamptz default now(),
  unique(user_id, token),
  constraint platform_check check (platform in ('android', 'ios', 'web'))
);

alter table public.devices enable row level security;

-- Users manage their own devices
create policy "devices: own rows" on public.devices
  for all using (auth.uid() = user_id);
