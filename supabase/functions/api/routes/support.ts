import { Hono } from 'https://deno.land/x/hono@v4.7.7/mod.ts'
import { zValidator } from 'https://deno.land/x/hono@v4.7.7/middleware.ts'
import { requireAuth, requireRole } from '../_shared/auth.ts'
import { getAdminClient } from '../_shared/db.ts'
import {
  PageQuerySchema,
  CreateConversationSchema,
  SendMessageSchema,
  UpdateConversationStatusSchema,
} from '../_shared/schemas.ts'

const support = new Hono()

// GET /api/support — list conversations (admin/support sees all, user sees own)
support.get('/', async (c) => {
  const authUser = await requireAuth(c)
  const admin = getAdminClient()
  const params = PageQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
  const { limit, offset, order, dir } = params

  const isStaff = ['admin', 'support'].includes(authUser.role)
  let q = admin
    .from('support_conversations')
    .select('*', { count: 'exact' })

  if (!isStaff) q = q.eq('user_id', authUser.id)

  const statusFilter = new URL(c.req.url).searchParams.get('status')
  if (statusFilter) q = q.eq('status', statusFilter)

  q = q.order(order, { ascending: dir === 'asc' }).range(offset, offset + limit - 1)

  const { data, count, error } = await q
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data, total: count ?? 0, limit, offset, hasMore: offset + limit < (count ?? 0) })
})

// POST /api/support — create conversation + first message
support.post('/', zValidator('json', CreateConversationSchema), async (c) => {
  const authUser = await requireAuth(c)
  const { subject, body } = c.req.valid('json')
  const admin = getAdminClient()

  const { data: conv, error: convErr } = await admin
    .from('support_conversations')
    .insert({ user_id: authUser.id, subject })
    .select()
    .single()

  if (convErr) return c.json({ error: convErr.message }, 500)

  await admin.from('support_messages').insert({
    conversation_id: conv.id,
    sender_id: authUser.id,
    body,
  })

  return c.json(conv, 201)
})

// GET /api/support/:id/messages
support.get('/:id/messages', async (c) => {
  const authUser = await requireAuth(c)
  const admin = getAdminClient()
  const convId = c.req.param('id')

  // Verify access
  const { data: conv } = await admin
    .from('support_conversations')
    .select('user_id')
    .eq('id', convId)
    .single()

  const isStaff = ['admin', 'support'].includes(authUser.role)
  if (!conv || (!isStaff && conv.user_id !== authUser.id)) {
    return c.json({ error: 'Not found' }, 404)
  }

  const { data, error } = await admin
    .from('support_messages')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// POST /api/support/:id/messages
support.post('/:id/messages', zValidator('json', SendMessageSchema), async (c) => {
  const authUser = await requireAuth(c)
  const { body } = c.req.valid('json')
  const admin = getAdminClient()
  const convId = c.req.param('id')

  const { data: conv } = await admin
    .from('support_conversations')
    .select('user_id')
    .eq('id', convId)
    .single()

  const isStaff = ['admin', 'support'].includes(authUser.role)
  if (!conv || (!isStaff && conv.user_id !== authUser.id)) {
    return c.json({ error: 'Not found' }, 404)
  }

  const { data, error } = await admin
    .from('support_messages')
    .insert({ conversation_id: convId, sender_id: authUser.id, body })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)

  // Update conversation status + updated_at
  const newStatus = isStaff ? 'waiting_on_customer' : 'open'
  await admin
    .from('support_conversations')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', convId)

  return c.json(data, 201)
})

// PATCH /api/support/:id/status — admin/support
support.patch('/:id/status', zValidator('json', UpdateConversationStatusSchema), async (c) => {
  await requireRole(c, 'admin', 'support')
  const { status } = c.req.valid('json')
  const admin = getAdminClient()

  const { data, error } = await admin
    .from('support_conversations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', c.req.param('id'))
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export { support }
