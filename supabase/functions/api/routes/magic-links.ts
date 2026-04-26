import { Hono } from 'npm:hono'
import { requireRole } from '../../_shared/auth.ts'
import { getAdminClient } from '../../_shared/db.ts'
import { PageQuerySchema } from '../../_shared/schemas.ts'

const magicLinks = new Hono()

// GET /api/magic-links?user_id=xxx — admin/support: list links for a user
magicLinks.get('/', async (c) => {
  await requireRole(c, 'admin', 'support')
  const admin = getAdminClient()
  const params = PageQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
  const userId = new URL(c.req.url).searchParams.get('user_id')

  if (!userId) return c.json({ error: 'user_id required' }, 400)

  const { data, count, error } = await admin
    .from('magic_links')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(params.offset, params.offset + params.limit - 1)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({
    data,
    total: count ?? 0,
    limit: params.limit,
    offset: params.offset,
    hasMore: params.offset + params.limit < (count ?? 0),
  })
})

// POST /api/magic-links — generate link for a user
magicLinks.post('/', async (c) => {
  const authUser = await requireRole(c, 'admin', 'support')
  const admin = getAdminClient()
  const { user_id } = await c.req.json() as { user_id: string }

  const { data: targetUser } = await admin.from('users').select('email').eq('id', user_id).single()
  if (!targetUser) return c.json({ error: 'User not found' }, 404)

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: targetUser.email,
  })

  if (error) return c.json({ error: error.message }, 500)

  const url = data.properties.action_link

  // Store hash of token
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(url),
  )
  const tokenHash = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  await admin.from('magic_links').insert({
    user_id,
    generated_by: authUser.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1h
  })

  return c.json({ url })
})

export { magicLinks }
