-- Migration: email_templates (customizable transactional email metadata)

create table public.email_templates (
  id            text primary key,   -- 'welcome' | 'password_reset' | 'support_reply' | ...
  subject       text not null,
  sender_name   text not null default 'Support',
  enabled       bool not null default true,
  custom_footer text,
  updated_at    timestamptz default now()
);

alter table public.email_templates enable row level security;

-- No anon reads — service role only
create policy "email_templates: no anon access" on public.email_templates
  for all using (false);

-- Seed default subjects
insert into public.email_templates (id, subject) values
  ('welcome',          'Welcome to {{project_name}}'),
  ('password_reset',   'Reset your password'),
  ('support_reply',    'New reply to your support request'),
  ('credit_depletion', 'You''re out of credits'),
  ('payment_failed',   'Payment failed — action required'),
  ('magic_link',       'Your login link')
on conflict (id) do nothing;
