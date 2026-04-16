-- Seed: dev/test users
-- Never modify existing users — add new ones for new states.
-- Maintained in sync with DevLogin.tsx seed users list.

-- NOTE: Supabase local dev uses the auth admin API to create users.
-- This seed creates auth.users rows + public.users rows for each.
-- Run via: supabase db reset

-- Insert auth users (password: 'devpassword' for all)
select auth.create_user(jsonb_build_object(
  'email', 'admin@dev.local',
  'password', 'devpassword',
  'email_confirmed_at', now()
)) where not exists (select 1 from auth.users where email = 'admin@dev.local');

select auth.create_user(jsonb_build_object(
  'email', 'support@dev.local',
  'password', 'devpassword',
  'email_confirmed_at', now()
)) where not exists (select 1 from auth.users where email = 'support@dev.local');

select auth.create_user(jsonb_build_object(
  'email', 'user@dev.local',
  'password', 'devpassword',
  'email_confirmed_at', now()
)) where not exists (select 1 from auth.users where email = 'user@dev.local');

select auth.create_user(jsonb_build_object(
  'email', 'user-nocredits@dev.local',
  'password', 'devpassword',
  'email_confirmed_at', now()
)) where not exists (select 1 from auth.users where email = 'user-nocredits@dev.local');

select auth.create_user(jsonb_build_object(
  'email', 'user-sub@dev.local',
  'password', 'devpassword',
  'email_confirmed_at', now()
)) where not exists (select 1 from auth.users where email = 'user-sub@dev.local');

-- Set roles
update public.users set role = 'admin',   name = 'Dev Admin'
  where email = 'admin@dev.local';
update public.users set role = 'support', name = 'Dev Support'
  where email = 'support@dev.local';
update public.users set name = 'Dev User'
  where email = 'user@dev.local';
update public.users set name = 'Dev User (no credits)'
  where email = 'user-nocredits@dev.local';
update public.users set name = 'Dev User (subscription)'
  where email = 'user-sub@dev.local';

-- Seed credits for pricing != none
-- user@dev.local gets 100 credits; user-nocredits gets 0; user-sub gets unlimited
insert into public.credits (user_id, balance)
  select id, 100 from public.users where email = 'user@dev.local'
on conflict (user_id) do update set balance = 100;

insert into public.credits (user_id, balance)
  select id, 0 from public.users where email = 'user-nocredits@dev.local'
on conflict (user_id) do update set balance = 0;

insert into public.credits (user_id, balance)
  select id, 999999 from public.users where email in ('admin@dev.local', 'support@dev.local', 'user-sub@dev.local')
on conflict (user_id) do update set balance = 999999;
