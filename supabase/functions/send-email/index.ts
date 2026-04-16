import { Hono } from 'https://deno.land/x/hono@v4.7.7/mod.ts'

type EmailRequest = {
  to: string
  template: 'welcome' | 'password_reset' | 'support_reply' | 'credit_depletion' | 'payment_failed' | 'magic_link'
  data: Record<string, string>
}

const app = new Hono()

app.post('/', async (c) => {
  // Internal only
  const secret = c.req.header('x-internal-secret')
  if (secret !== Deno.env.get('INTERNAL_SECRET')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const { to, template, data } = await c.req.json() as EmailRequest

  const smtpHost = Deno.env.get('SMTP_HOST')
  if (!smtpHost) {
    console.warn('[send-email] SMTP_HOST not set — email skipped')
    return c.json({ ok: true, skipped: true })
  }

  // TODO: implement SMTP send using nodemailer or Resend API.
  // Template rendering: import React email component, render to HTML, send.
  console.log('[send-email] Would send:', { to, template, data })

  return c.json({ ok: true })
})

Deno.serve(app.fetch)
