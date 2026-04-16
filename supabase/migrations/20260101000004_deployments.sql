-- Migration: deployments (version/release history)

create table public.deployments (
  id          uuid primary key default gen_random_uuid(),
  env         text not null,
  sha         text not null,
  branch      text not null,
  deployed_at timestamptz default now()
);

alter table public.deployments enable row level security;

-- Only admins (via service role) can insert; no anon reads
create policy "deployments: no anon access" on public.deployments
  for all using (false);  -- service role bypasses RLS
