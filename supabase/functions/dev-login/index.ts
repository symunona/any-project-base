import { getAdminClient } from '../_shared/db.ts'

// GUARD — must be first. Returns 403 in prod.
const APP_ENV = Deno.env.get('APP_ENV')

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (APP_ENV === 'prod') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { email, redirectTo } = await req.json() as { email: string; redirectTo?: string }
  const admin = getAdminClient()

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ url: data.properties.action_link }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
