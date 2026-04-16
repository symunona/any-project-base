-- Migration: public.users + role trigger
-- Never alter this file — create a new migration for changes.

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text not null,
  role        text not null default 'user',
  locale      text not null default 'en',
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint role_check check (role in ('user', 'support', 'admin'))
);

-- Enable RLS
alter table public.users enable row level security;

-- Users can read + update their own row
create policy "users: own row read" on public.users
  for select using (auth.uid() = id);

create policy "users: own row update" on public.users
  for update using (auth.uid() = id);

-- Auto-insert user row on auth.users creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();
