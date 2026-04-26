import { Hono } from 'npm:hono'
import { requireAuth, requireRole } from '../../_shared/auth.ts'
import { getAdminClient } from '../../_shared/db.ts'
import { PageQuerySchema } from '../../_shared/schemas.ts'

const usage = new Hono()

// GET /api/usage — admin/support: all usage. User: own usage.
usage.get('/', async (c) => {
  const authUser = await requireAuth(c)
  const admin = getAdminClient()
  const params = PageQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
  const { limit, offset, order, dir } = params

  const isStaff = ['admin', 'support'].includes(authUser.role)
  let q = admin.from('usage').select('*', { count: 'exact' })
  if (!isStaff) q = q.eq('user_id', authUser.id)

  q = q.order(order, { ascending: dir === 'asc' }).range(offset, offset + limit - 1)
  const { data, count, error } = await q
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data, total: count ?? 0, limit, offset, hasMore: offset + limit < (count ?? 0) })
})

export { usage }
