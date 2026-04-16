import { Hono } from 'https://deno.land/x/hono@v4.7.7/mod.ts'
import { getAdminClient } from '../_shared/db.ts'

// GUARD — must be first. Returns 403 in prod.
const APP_ENV = Deno.env.get('APP_ENV')

const app = new Hono()

app.post('/', async (c) => {
  if (APP_ENV === 'prod') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const { email } = await c.req.json() as { email: string }
  const admin = getAdminClient()

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (error) return c.json({ error: error.message }, 500)

  return c.json({ url: data.properties.action_link })
})

Deno.serve(app.fetch)
