import { Hono } from 'npm:hono'
import { zValidator } from 'npm:@hono/zod-validator'
import { z } from 'npm:zod@3'
import { requireRole } from '../../_shared/auth.ts'
import { getAdminClient } from '../../_shared/db.ts'

const emailTemplates = new Hono()

// GET /api/email-templates — list all (admin/support)
emailTemplates.get('/', async (c) => {
  await requireRole(c, 'admin', 'support')
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('email_templates')
    .select('id, type, subject, sender_name, enabled, variables, updated_at')
    .order('type', { ascending: true })
    .order('id', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data: data ?? [] })
})

// GET /api/email-templates/:id — get single template (admin/support)
emailTemplates.get('/:id', async (c) => {
  await requireRole(c, 'admin', 'support')
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('email_templates')
    .select('*')
    .eq('id', c.req.param('id'))
    .single()
  if (error) return c.json({ error: 'Template not found' }, 404)
  return c.json(data)
})

const PatchSchema = z.object({
  subject:       z.string().min(1).max(200).optional(),
  sender_name:   z.string().max(100).optional(),
  enabled:       z.boolean().optional(),
  custom_footer: z.string().max(500).nullable().optional(),
  body_html:     z.string().optional(),
})

// PATCH /api/email-templates/:id — update (admin only, no delete)
emailTemplates.patch('/:id', zValidator('json', PatchSchema), async (c) => {
  await requireRole(c, 'admin')
  const admin = getAdminClient()
  const body = c.req.valid('json')

  const { data, error } = await admin
    .from('email_templates')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', c.req.param('id'))
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export { emailTemplates }
