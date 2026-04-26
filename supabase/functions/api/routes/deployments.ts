import { Hono } from 'npm:hono'
import { requireRole } from '../../_shared/auth.ts'
import { getAdminClient } from '../../_shared/db.ts'
import { PageQuerySchema } from '../../_shared/schemas.ts'

const deployments = new Hono()

// GET /api/deployments — admin only
deployments.get('/', async (c) => {
  await requireRole(c, 'admin')
  const admin = getAdminClient()
  const params = PageQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
  const { limit, offset } = params

  const { data, count, error } = await admin
    .from('deployments')
    .select('*', { count: 'exact' })
    .order('deployed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data, total: count ?? 0, limit, offset, hasMore: offset + limit < (count ?? 0) })
})

// POST /api/deployments — called by CI on deploy
deployments.post('/', async (c) => {
  // Service role key only — no user auth needed here
  const apiKey = c.req.header('x-deploy-key')
  if (apiKey !== Deno.env.get('DEPLOY_SECRET')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json() as { env: string; sha: string; branch: string }
  const admin = getAdminClient()
  const { data, error } = await admin.from('deployments').insert(body).select().single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

export { deployments }
