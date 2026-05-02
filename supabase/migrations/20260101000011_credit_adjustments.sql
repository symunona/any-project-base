create table public.credit_adjustments (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  admin_id   uuid        references auth.users(id),
  delta      integer     not null,
  note       text,
  source     text        not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.credit_adjustments enable row level security;
-- No client-facing policy: only service role (edge functions) can write/read.
