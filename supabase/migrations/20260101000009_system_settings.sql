-- supabase/migrations/20260101000009_system_settings.sql
create table public.system_settings (
  id                integer primary key default 1 check (id = 1),
  registration_open boolean not null default true,
  maintenance_mode  boolean not null default false,
  invite_only       boolean not null default false,
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users(id),
  created_at        timestamptz not null default now()
);

-- Seed the single row on creation
insert into public.system_settings (id) values (1);

-- Public read (login page needs registration_open without auth).
-- No client write — only service role via edge function.
alter table public.system_settings enable row level security;
create policy "system_settings: public read"
  on public.system_settings for select using (true);
