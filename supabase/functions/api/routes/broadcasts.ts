import { Hono } from 'npm:hono'
import { zValidator } from 'npm:@hono/zod-validator'
import { z } from 'npm:zod@3'
import { requireRole } from '../../_shared/auth.ts'
import { getAdminClient } from '../../_shared/db.ts'

const broadcasts = new Hono()

const FilterSchema = z.object({
  roles: z.array(z.string()).default([]),
})

// GET /api/broadcasts/preview — count + 5 sample users matching filter
broadcasts.get('/preview', async (c) => {
  await requireRole(c, 'admin')
  const admin = getAdminClient()

  const rolesParam = c.req.query('roles')
  const roles = rolesParam ? rolesParam.split(',').filter(Boolean) : []

  let q = admin.from('users').select('id, name, email, role, created_at', { count: 'exact' })
  if (roles.length > 0) q = q.in('role', roles)
  q = q.order('created_at', { ascending: false }).limit(5)

  const { data, count, error } = await q
  if (error) return c.json({ error: error.message }, 500)

  return c.json({ count: count ?? 0, sample: data ?? [] })
})

const SendSchema = z.object({
  subject:  z.string().min(1).max(200),
  body_html: z.string().min(1),
  filter: FilterSchema,
})

// POST /api/broadcasts/send — send to matching users
broadcasts.post('/send', zValidator('json', SendSchema), async (c) => {
  await requireRole(c, 'admin')
  const admin = getAdminClient()
  const { subject, body_html, filter } = c.req.valid('json')

  // Fetch all matching users
  let q = admin.from('users').select('id, name, email, role')
  if (filter.roles.length > 0) q = q.in('role', filter.roles)
  const { data: users, error: usersErr } = await q
  if (usersErr) return c.json({ error: usersErr.message }, 500)
  if (!users?.length) return c.json({ sent: 0, failed: 0, errors: [] })

  const siteUrl = Deno.env.get('SITE_URL') ?? ''
  const projectName = Deno.env.get('PROJECT_NAME') ?? 'App'
  const internalSecret = Deno.env.get('INTERNAL_SECRET') ?? ''
  const sendEmailUrl = Deno.env.get('SEND_EMAIL_URL') ?? `${new URL(c.req.url).origin.replace('/api', '')}/send-email`

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const user of users) {
    const data: Record<string, string> = {
      user_name:    user.name ?? user.email,
      project_name: projectName,
      site_url:     siteUrl,
    }
    try {
      const res = await fetch(sendEmailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret,
        },
        body: JSON.stringify({ to: user.email, subject, body_html, data }),
      })
      if (res.ok) {
        sent++
      } else {
        failed++
        const err = await res.text()
        errors.push(`${user.email}: ${err}`)
      }
    } catch (e) {
      failed++
      errors.push(`${user.email}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return c.json({ sent, failed, errors })
})

export { broadcasts }
