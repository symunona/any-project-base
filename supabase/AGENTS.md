# supabase/ — AGENTS.md

Read first:
1. `/AGENTS.md` (root)
2. `architecture/auth.md`
3. `architecture/pricing.md` (if touching billing)
4. `architecture/paging.md` (if touching list endpoints)

---

## Purpose

Backend: PostgreSQL database, Supabase Auth, edge functions (Deno).
Locally runnable via Docker (`supabase start`). Two cloud envs: `test`, `prod`.

## Directory Structure

```
supabase/
  config.toml
  seed.sql                          ← dev/test seed users + data
  migrations/                       ← sequential, never edit existing files
    20260101000000_init.sql         ← public.users, role, trigger from auth.users
    20260101000001_devices.sql      ← push notification tokens
    20260101000002_support.sql      ← support_conversations, support_messages
    20260101000003_usage.sql        ← LLM call tracking
    20260101000004_deployments.sql
    20260101000005_magic_links.sql  ← admin-generated client login links
    20260101000006_stripe.sql       ← stripe mirror tables (pricing != none)
    20260101000007_credits.sql      ← credit balance (credits|subscription_credits)
  functions/
    _shared/                        ← Deno-native, imported by functions directly
      types.ts                      ← PagedResponse<T>, shared interfaces
      schemas.ts                    ← Zod schemas (backend source of truth)
      auth.ts                       ← requireAuth(), requireRole()
      db.ts                         ← typed supabase client factory
    api/
      index.ts                      ← Hono app root, exports AppType
      routes/
        users.ts
        support.ts
        usage.ts
        deployments.ts
        magic-links.ts
        stripe.ts                   ← pricing != none
        credits.ts                  ← credits | subscription_credits
    dev-login/
      index.ts                      ← non-prod only, 403 in prod
    stripe-webhook/
      index.ts                      ← Stripe event handler, idempotent
    send-push/
      index.ts                      ← FCM push sender
    send-email/
      index.ts                      ← transactional email
```

## Database Schema

### Rules
- Every table has RLS enabled
- Every table has `created_at timestamptz default now()`
- Never alter existing migrations — create new ones
- Run `supabase db reset` after adding migrations to verify clean apply

### public.users
```sql
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text not null,
  role        text not null default 'user',
  locale      text not null default 'en',  -- top-level: used for routing/rendering
  settings    jsonb not null default '{}'::jsonb,
  -- settings shape (validated via Zod on read/write, never raw):
  -- {
  --   onboarding_step: number,   -- 0=not started, 1=step1 done, 2=complete
  --   dark_mode: boolean,
  --   notification_settings: {
  --     email: { support_reply: bool, credit_depletion: bool, payment_failed: bool },
  --     push:  { support_reply: bool }
  --   }
  -- }
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint role_check check (role in ('user', 'support', 'admin'))
);

-- auto-insert on auth.users creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### devices
```sql
create table devices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  token       text not null,
  platform    text not null,   -- 'android' | 'ios' | 'web'
  last_seen   timestamptz default now(),
  created_at  timestamptz default now(),
  unique(user_id, token)
);
```

### support_conversations + support_messages
```sql
create table support_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete cascade,
  status     text not null default 'new',
  subject    text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint status_check check (status in ('new','open','waiting_on_customer','closed'))
);

create table support_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references support_conversations(id) on delete cascade,
  sender_id       uuid references public.users(id),
  body            text not null,
  created_at      timestamptz default now()
);
```

### usage
```sql
create table usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete cascade,
  model         text not null,
  input_tokens  integer,
  output_tokens integer,
  cost_usd      numeric(10,6),
  credits_used  integer,
  endpoint      text,
  created_at    timestamptz default now()
);
```

### deployments
```sql
create table deployments (
  id          uuid primary key default gen_random_uuid(),
  env         text not null,
  sha         text not null,
  branch      text not null,
  deployed_at timestamptz default now()
);
```

### magic_links
```sql
create table magic_links (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id) on delete cascade,
  generated_by uuid references public.users(id),
  token_hash   text not null,
  clicked_at   timestamptz,         -- null = not yet used. set on first click = dead.
  expires_at   timestamptz not null,
  created_at   timestamptz default now()
);
```

### email_templates
```sql
create table email_templates (
  id            text primary key,  -- 'welcome' | 'password_reset' | 'support_reply'
                                   -- | 'credit_depletion' | 'payment_failed' | 'magic_link'
  subject       text not null,
  sender_name   text not null default 'Support',
  enabled       bool not null default true,
  custom_footer text,
  updated_at    timestamptz default now()
);

-- seed default subjects
insert into email_templates (id, subject) values
  ('welcome',          'Welcome to {{project_name}}'),
  ('password_reset',   'Reset your password'),
  ('support_reply',    'New reply to your support request'),
  ('credit_depletion', 'You''re out of credits'),
  ('payment_failed',   'Payment failed — action required'),
  ('magic_link',       'Your login link');
```

### stripe tables (pricing != none) — see architecture/pricing.md
```sql
-- stripe_customers, stripe_subscriptions, stripe_transactions
-- all prefixed stripe_ to distinguish from own tables
```

### credits (credits | subscription_credits)
```sql
create table credits (
  user_id    uuid primary key references public.users(id) on delete cascade,
  balance    integer not null default 0,
  updated_at timestamptz default now()
);
-- deduct atomically: UPDATE credits SET balance = balance - $n WHERE user_id = $id AND balance >= $n
-- 0 rows updated = insufficient credits, reject call
```

## RLS Pattern

```sql
-- enable on every table
alter table devices enable row level security;

-- users: own rows only (anon key)
create policy "own rows" on devices
  for all using (auth.uid() = user_id);

-- admin/support access via edge functions with service role key only
-- service role bypasses RLS — never expose service role key to frontend
```

## Edge Functions

### Auth helpers (_shared/auth.ts)
```typescript
export async function requireAuth(c: Context): Promise<User>
export async function requireRole(c: Context, ...roles: string[]): Promise<User>
// returns 401/403 response if check fails
// updates devices.last_seen on every authenticated request
```

### api/index.ts
```typescript
const app = new Hono()
  .basePath('/api')
  .route('/users', users)
  .route('/support', support)
  .route('/usage', usage)
  .route('/deployments', deployments)
  .route('/magic-links', magicLinks)
  // conditional routes wired at startup based on env vars

export type AppType = typeof app  // imported by commons for typed client
```

### LLM credit gate — api/routes/llm.ts

All LLM calls go through this route. Credits deducted atomically before calling model.

```typescript
app.post('/llm/chat', async (c) => {
  const user = await requireAuth(c)
  const { message } = await c.req.json()
  const cost = 1  // credits per call — adjust per model/pricing

  // atomic deduct — 0 rows = insufficient credits
  const { count } = await adminClient
    .from('credits')
    .update({ balance: sql`balance - ${cost}` })
    .eq('user_id', user.id)
    .gte('balance', cost)

  if (count === 0) return c.json({ error: 'insufficient_credits' }, 402)

  // only now: call LLM via commons/lib/llm wrapper
  const reply = await llm.complete(message)

  // log usage
  await adminClient.from('usage').insert({
    user_id: user.id, model: 'claude-sonnet-4-6',
    credits_used: cost, endpoint: 'chat'
  })

  return c.json({ reply })
})
```

Frontend catches 402 → shows "Out of credits" + link to billing.
pricing_model: none → seed user with unlimited credits (balance: 999999).

### Paging — all list routes must follow architecture/paging.md
```typescript
// every GET returning a list:
return c.json({ data, total: count, limit, offset, hasMore: offset + limit < count })
```

### stripe-webhook/index.ts
- Verify Stripe signature first — reject if invalid
- Idempotent via `stripe_event_id` unique constraint in `stripe_transactions`
- Handle: `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`

### dev-login/index.ts
```typescript
// GUARD — must be first lines
if (Deno.env.get('APP_ENV') === 'prod') return c.json({ error: 'Forbidden' }, 403)
// generate magic link via adminClient, return URL
```

## Email Confirmation on Registration

By default, local dev has confirmations disabled so `signUp()` returns a session immediately.

To require email confirmation (e.g. when testing the confirmation flow):

1. `supabase/config.toml` → set `enable_confirmations = true` under `[auth.email]`
2. `just start` (restart Supabase to pick up config change)
3. Confirmation emails are captured by Inbucket — view at `http://localhost:54324`

To disable again: set `enable_confirmations = false` and restart.

In prod: set via Supabase dashboard → Authentication → Email → Confirm email. Not controlled by config.toml in cloud deployments.

## Local Dev Commands

```bash
supabase start                                                    # start local stack
supabase db reset                                                 # reset + migrations + seed
supabase gen types typescript --local > commons/types/db.types.ts # regenerate types
supabase functions serve                                          # serve edge functions locally
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

## seed.sql — test users

Always maintain these. Add new ones for new states, never modify existing:

| Email | Role | State |
|-------|------|-------|
| admin@dev.local | admin | — |
| support@dev.local | support | — |
| user@dev.local | user | has credits |
| user-nocredits@dev.local | user | zero credits |
| user-sub@dev.local | user | active subscription |

## Checkers

`setup/checks/supabase_check.sh`:
- `supabase db reset` applies cleanly
- RLS enabled on every public table
- No table missing `created_at`
- `db.types.ts` not stale vs last migration
- Zod schemas in `_shared/schemas.ts` match `commons/` schemas (drift check — see philosophy.md)
- `dev-login` function has `APP_ENV` guard (grep)
- All list endpoints return `PagedResponse` envelope (grep for `hasMore`)
