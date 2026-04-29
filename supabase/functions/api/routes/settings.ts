import { Hono } from 'npm:hono'
import { zValidator } from 'npm:@hono/zod-validator'
import { requireRole } from '../../_shared/auth.ts'
import { getAdminClient } from '../../_shared/db.ts'
import { UpdateSystemSettingsSchema } from '../../_shared/schemas.ts'

const settings = new Hono()

// GET /api/settings — public, no auth required
settings.get('/', async (c) => {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('system_settings')
    .select('registration_open, maintenance_mode, invite_only')
    .eq('id', 1)
    .single()
  if (error || !data) return c.json({ error: error?.message ?? 'Settings not found' }, 500)
  return c.json(data)
})

// PATCH /api/settings — admin only
settings.patch('/', zValidator('json', UpdateSystemSettingsSchema), async (c) => {
  const authUser = await requireRole(c, 'admin')
  const admin = getAdminClient()
  const body = c.req.valid('json')

  const { data, error } = await admin
    .from('system_settings')
    .update({ ...body, updated_at: new Date().toISOString(), updated_by: authUser.id })
    .eq('id', 1)
    .select('registration_open, maintenance_mode, invite_only')
    .single()

  if (error || !data) return c.json({ error: error?.message ?? 'Update failed' }, 500)
  return c.json(data)
})

export { settings }
