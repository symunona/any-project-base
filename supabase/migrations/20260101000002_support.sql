-- Migration: support_conversations + support_messages

create table public.support_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  status      text not null default 'new',
  subject     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint status_check check (status in ('new','open','waiting_on_customer','closed'))
);

alter table public.support_conversations enable row level security;

-- Users see their own conversations
create policy "support_conversations: own rows" on public.support_conversations
  for all using (auth.uid() = user_id);

create trigger support_conversations_updated_at
  before update on public.support_conversations
  for each row execute procedure public.set_updated_at();

-- ────────────────────────────────────────────

create table public.support_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_id       uuid references public.users(id) on delete set null,
  body            text not null,
  created_at      timestamptz default now()
);

alter table public.support_messages enable row level security;

-- Users can read messages in their own conversations
create policy "support_messages: read own" on public.support_messages
  for select using (
    exists (
      select 1 from public.support_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Users can insert messages into their own conversations
create policy "support_messages: insert own" on public.support_messages
  for insert with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.support_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
