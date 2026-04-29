-- Seed: dev/test users
-- Never modify existing users — add new ones for new states.
-- Maintained in sync with DevLogin.tsx seed users list.

-- NOTE: auth.create_user(jsonb) was removed in newer Supabase CLI versions.
-- We insert directly into auth.users and auth.identities (required for email
-- provider sign-in in newer Supabase auth versions).
-- Password for all dev users: 'devpassword'
-- Run via: supabase db reset  OR  just db-reset

-- Step 1: insert missing auth.users rows
-- Use a CTE to generate one UUID per row so id and sub stay in sync.
with new_users as (
  select
    gen_random_uuid() as id,
    u.email
  from (values
    ('admin@dev.local'),
    ('support@dev.local'),
    ('user@dev.local'),
    ('user-nocredits@dev.local'),
    ('user-sub@dev.local')
  ) as u(email)
  where not exists (select 1 from auth.users where auth.users.email = u.email)
)
insert into auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  nu.id,
  '00000000-0000-0000-0000-000000000000',
  nu.email,
  crypt('devpassword', gen_salt('bf')),
  now(), now(), now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_build_object(
    'sub',            nu.id::text,
    'email',          nu.email,
    'email_verified', true,
    'phone_verified', false
  ),
  false,
  'authenticated',
  'authenticated',
  '', '', '', ''
from new_users nu;

-- Step 2: insert missing auth.identities rows (required for email sign-in)
-- Each user needs an identity with provider='email' that matches their user id.
-- Note: 'email' column is GENERATED ALWAYS — omit it, it is derived from identity_data.
insert into auth.identities (
  id, user_id, provider_id, provider,
  identity_data,
  last_sign_in_at, created_at, updated_at
)
select
  au.id,                    -- identity id = user id (Supabase convention for email)
  au.id,                    -- user_id FK
  au.email,                 -- provider_id = email for email provider
  'email',
  jsonb_build_object(
    'sub',            au.id::text,
    'email',          au.email,
    'email_verified', true,
    'phone_verified', false
  ),
  now(), now(), now()
from auth.users au
where au.email in (
  'admin@dev.local',
  'support@dev.local',
  'user@dev.local',
  'user-nocredits@dev.local',
  'user-sub@dev.local'
)
and not exists (
  select 1 from auth.identities ai
  where ai.user_id = au.id and ai.provider = 'email'
);

-- Set roles, names, and initial settings
update public.users
  set role = 'admin', name = 'Dev Admin',
      settings = '{"onboarding_step":1,"dark_mode":false,"notification_settings":{"email":{"support_reply":true,"credit_depletion":true,"payment_failed":true},"push":{"support_reply":true}}}'::jsonb
  where email = 'admin@dev.local';
update public.users
  set role = 'support', name = 'Dev Support',
      settings = '{"onboarding_step":1,"dark_mode":false,"notification_settings":{"email":{"support_reply":true,"credit_depletion":true,"payment_failed":true},"push":{"support_reply":true}}}'::jsonb
  where email = 'support@dev.local';
update public.users
  set name = 'Dev User',
      settings = '{"onboarding_step":1,"dark_mode":false,"notification_settings":{"email":{"support_reply":true,"credit_depletion":true,"payment_failed":false},"push":{"support_reply":true}}}'::jsonb
  where email = 'user@dev.local';
update public.users
  set name = 'Dev User (no credits)',
      settings = '{"onboarding_step":1,"dark_mode":false,"notification_settings":{"email":{"support_reply":true,"credit_depletion":true,"payment_failed":true},"push":{"support_reply":false}}}'::jsonb
  where email = 'user-nocredits@dev.local';
update public.users
  set name = 'Dev User (subscription)',
      settings = '{"onboarding_step":1,"dark_mode":true,"notification_settings":{"email":{"support_reply":true,"credit_depletion":false,"payment_failed":true},"push":{"support_reply":true}}}'::jsonb
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
