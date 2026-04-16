import { Hono } from 'https://deno.land/x/hono@v4.7.7/mod.ts'
import { getAdminClient } from '../_shared/db.ts'

type PushPayload = {
  user_id: string
  title: string
  body: string
  data?: Record<string, string>
}

const app = new Hono()

app.post('/', async (c) => {
  // Internal only — requires DEPLOY_SECRET header
  const secret = c.req.header('x-internal-secret')
  if (secret !== Deno.env.get('INTERNAL_SECRET')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const payload = await c.req.json() as PushPayload
  const admin = getAdminClient()

  // Fetch device tokens for user
  const { data: devices, error } = await admin
    .from('devices')
    .select('token, platform')
    .eq('user_id', payload.user_id)

  if (error) return c.json({ error: error.message }, 500)
  if (!devices?.length) return c.json({ ok: true, sent: 0 })

  const fcmKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
  if (!fcmKey) return c.json({ error: 'FCM not configured' }, 503)

  // Send via FCM for android/ios, Web Push for web
  // Placeholder — implement FCM HTTP v1 API call here
  const results = await Promise.allSettled(
    devices.map(async (device) => {
      if (device.platform === 'web') {
        // Web Push — TODO: implement using web-push library
        return { token: device.token, status: 'not_implemented' }
      }
      // FCM
      const fcmUrl = 'https://fcm.googleapis.com/v1/projects/TODO/messages:send'
      const res = await fetch(fcmUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer TODO_ACCESS_TOKEN`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: device.token,
            notification: { title: payload.title, body: payload.body },
            data: payload.data ?? {},
          },
        }),
      })
      return { token: device.token, status: res.ok ? 'sent' : 'failed' }
    }),
  )

  return c.json({ ok: true, sent: results.length })
})

Deno.serve(app.fetch)
