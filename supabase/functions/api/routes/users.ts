import { Hono } from 'https://deno.land/x/hono@v4.7.7/mod.ts'
import { zValidator } from 'https://deno.land/x/hono@v4.7.7/middleware.ts'
import { requireAuth, requireRole } from '../_shared/auth.ts'
import { getAdminClient } from '../_shared/db.ts'
import { PageQuerySchema, UpdateUserSettingsSchema } from '../_shared/schemas.ts'

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

// GET /api/users/:id — admin/support: user detail
users.get('/:id', async (c) => {
  await requireRole(c, 'admin', 'support')
  const admin = getAdminClient()
  const { data, error } = await admin.from('users').select('*').eq('id', c.req.param('id')).single()
  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
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
