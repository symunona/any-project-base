import { Hono } from 'npm:hono'
import { zValidator } from 'npm:@hono/zod-validator'
import { z } from 'npm:zod@3'
import { requireAuth, requireRole } from '../../_shared/auth.ts'
import { getAdminClient } from '../../_shared/db.ts'
import { PageQuerySchema, UpdateUserSettingsSchema, AdjustCreditsSchema } from '../../_shared/schemas.ts'
import { calcCreditsPriceUsd } from '../../_shared/pricing.ts'

const users = new Hono()

// GET /api/users — admin/support: pageable list
users.get('/', async (c) => {
  await requireRole(c, 'admin', 'support')
  const admin = getAdminClient()

  const query = PageQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
  const { limit, offset, order, dir, search } = query

  let q = admin.from('users').select('*', { count: 'exact' })
  if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  q = q.order(order, { ascending: dir === 'asc' }).range(offset, offset + limit - 1)

  const { data, count, error } = await q
  if (error) return c.json({ error: error.message }, 500)

  return c.json({ data, total: count ?? 0, limit, offset, hasMore: offset + limit < (count ?? 0) })
})

// GET /api/users/me — current user
users.get('/me', async (c) => {
  const authUser = await requireAuth(c)
  const admin = getAdminClient()
  const { data, error } = await admin.from('users').select('*').eq('id', authUser.id).single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// PATCH /api/users/me — update own name
users.patch('/me', zValidator('json', z.object({ name: z.string().max(100).optional() })), async (c) => {
  const authUser = await requireAuth(c)
  const { name } = c.req.valid('json')
  const admin = getAdminClient()

  const { data, error } = await admin
    .from('users')
    .update({ name: name?.trim() ?? null, updated_at: new Date().toISOString() })
    .eq('id', authUser.id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// GET /api/users/me/credits — current user balance
users.get('/me/credits', async (c) => {
  const authUser = await requireAuth(c)
  const admin = getAdminClient()
  const { data } = await admin.from('credits').select('balance').eq('user_id', authUser.id).single()
  return c.json({ balance: data?.balance ?? 0 })
})

// POST /api/users/me/credits/checkout — create checkout session (Stripe or mock)
users.post('/me/credits/checkout', async (c) => {
  const authUser = await requireAuth(c)
  const { credits, successUrl, cancelUrl } = await c.req.json() as {
    credits: number
    successUrl: string
    cancelUrl: string
  }

  if (!credits || credits < 1) return c.json({ error: 'Invalid amount' }, 400)

  const priceUsd   = calcCreditsPriceUsd(credits)
  const priceLabel = `$${priceUsd.toFixed(2)}`

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')

  if (!stripeKey) {
    // Dev mode: delegate to mock payment server
    const mockPaymentUrl = Deno.env.get('MOCK_PAYMENT_URL') ?? 'http://localhost:5242'

    let mockRes: Response
    try {
      mockRes = await fetch(`${mockPaymentUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authUser.id, credits, priceLabel, successUrl, cancelUrl }),
      })
    } catch {
      return c.json({ error: 'Mock payment server not running — start it with: just mock-payment' }, 503)
    }

    if (!mockRes.ok) return c.json({ error: 'Mock payment server error' }, 502)

    const { checkoutUrl } = await mockRes.json() as { checkoutUrl: string }
    return c.json({ url: checkoutUrl })
  }

  // Real Stripe checkout (for production)
  // TODO: implement full Stripe checkout session
  return c.json({ error: 'Stripe not configured — set STRIPE_SECRET_KEY' }, 503)
})

// POST /api/users/me/credits/mock-complete — dev-only, called by mock payment server on approve
users.post('/me/credits/mock-complete', async (c) => {
  if (Deno.env.get('APP_ENV') === 'prod') return c.json({ error: 'Forbidden' }, 403)

  const expected = Deno.env.get('MOCK_PAYMENT_SECRET') ?? 'dev-mock-secret'
  if (c.req.header('x-mock-payment-secret') !== expected) {
    return c.json({ error: 'Invalid secret' }, 403)
  }

  const { userId, credits } = await c.req.json() as { userId: string; credits: number; sessionId: string }
  const admin = getAdminClient()

  const { data: current } = await admin.from('credits').select('balance').eq('user_id', userId).single()
  const newBalance = (current?.balance ?? 0) + credits

  const { error } = await admin
    .from('credits')
    .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() })

  if (error) return c.json({ error: error.message }, 500)

  await admin.from('credit_adjustments').insert({
    user_id: userId, delta: credits, source: 'mock',
  })

  return c.json({ ok: true, balance: newBalance })
})

// PATCH /api/users/me/settings — update own settings
users.patch('/me/settings', zValidator('json', UpdateUserSettingsSchema), async (c) => {
  const authUser = await requireAuth(c)
  const body = c.req.valid('json')
  const admin = getAdminClient()

  const { data: current } = await admin.from('users').select('settings').eq('id', authUser.id).single()
  const merged = { ...(current?.settings ?? {}), ...body }

  const { data, error } = await admin
    .from('users')
    .update({ settings: merged })
    .eq('id', authUser.id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// POST /api/users/invite — admin only: send invite email
users.post('/invite', zValidator('json', z.object({ email: z.string().email() })), async (c) => {
  await requireRole(c, 'admin')
  const { email } = c.req.valid('json')
  const admin = getAdminClient()
  const { error } = await admin.auth.admin.inviteUserByEmail(email)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

// GET /api/users/:id — admin/support: user detail
users.get('/:id', async (c) => {
  await requireRole(c, 'admin', 'support')
  const admin = getAdminClient()
  const { data, error } = await admin.from('users').select('*').eq('id', c.req.param('id')).single()
  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

// GET /api/users/:id/credits/adjustments — admin/support: adjustment history
users.get('/:id/credits/adjustments', async (c) => {
  await requireRole(c, 'admin', 'support')
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('credit_adjustments')
    .select('id, delta, note, source, admin_id, created_at')
    .eq('user_id', c.req.param('id'))
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// GET /api/users/:id/credits — admin/support: current balance
users.get('/:id/credits', async (c) => {
  await requireRole(c, 'admin', 'support')
  const admin = getAdminClient()
  const { data } = await admin.from('credits').select('balance, updated_at').eq('user_id', c.req.param('id')).single()
  return c.json({ balance: data?.balance ?? 0, updated_at: data?.updated_at ?? null })
})

// POST /api/users/:id/credits — admin only: add/deduct credits
users.post('/:id/credits', zValidator('json', AdjustCreditsSchema), async (c) => {
  const authUser = await requireRole(c, 'admin')
  const admin = getAdminClient()
  const { delta, note } = c.req.valid('json')
  const userId = c.req.param('id')

  const { data: current } = await admin.from('credits').select('balance').eq('user_id', userId).single()
  const newBalance = Math.max(0, (current?.balance ?? 0) + delta)

  const { data, error } = await admin
    .from('credits')
    .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() })
    .select('balance')
    .single()

  if (error) return c.json({ error: error.message }, 500)

  await admin.from('credit_adjustments').insert({
    user_id: userId, admin_id: authUser.id, delta, note: note ?? null, source: 'admin',
  })

  return c.json({ balance: data.balance, delta })
})

// POST /api/users/:id/reset-password — admin only: send password reset email
users.post('/:id/reset-password', async (c) => {
  await requireRole(c, 'admin')
  const admin = getAdminClient()
  const { data: user, error: fetchErr } = await admin.from('users').select('email').eq('id', c.req.param('id')).single()
  if (fetchErr || !user) return c.json({ error: 'User not found' }, 404)
  const { error } = await admin.auth.admin.generateLink({ type: 'recovery', email: user.email })
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

// DELETE /api/users/me — self-delete
users.delete('/me', async (c) => {
  const authUser = await requireAuth(c)
  const admin = getAdminClient()
  const { error } = await admin.auth.admin.deleteUser(authUser.id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

// DELETE /api/users/:id — admin only
users.delete('/:id', async (c) => {
  await requireRole(c, 'admin')
  const admin = getAdminClient()
  const { error } = await admin.auth.admin.deleteUser(c.req.param('id'))
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

export { users }
