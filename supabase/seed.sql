-- Seed: dev/test users
-- Never modify existing users — add new ones for new states.
-- Maintained in sync with DevLogin.tsx seed users list.

-- NOTE: auth.create_user(jsonb) was removed in newer Supabase CLI versions.
-- We insert directly into auth.users using crypt() from pgcrypto (enabled by default).
-- Password for all dev users: 'devpassword'
-- Run via: supabase db reset

insert into auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
select
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  u.email,
  crypt('devpassword', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  'authenticated',
  'authenticated'
from (values
  ('admin@dev.local'),
  ('support@dev.local'),
  ('user@dev.local'),
  ('user-nocredits@dev.local'),
  ('user-sub@dev.local')
) as u(email)
where not exists (select 1 from auth.users where auth.users.email = u.email);

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
