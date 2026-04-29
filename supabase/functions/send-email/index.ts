import { Hono } from 'https://deno.land/x/hono@v4.7.7/mod.ts'

// Renders {{variable}} placeholders in a string.
function render(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`)
}

type EmailRequest = {
  to:        string
  subject:   string
  body_html: string
  data:      Record<string, string>
}

const app = new Hono()

app.post('/', async (c) => {
  const secret = c.req.header('x-internal-secret')
  if (secret !== Deno.env.get('INTERNAL_SECRET')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const { to, subject, body_html, data } = await c.req.json() as EmailRequest

  // Inject global vars if not already in data
  const globalVars: Record<string, string> = {
    project_name:  Deno.env.get('PROJECT_NAME')  ?? 'App',
    site_url:      Deno.env.get('SITE_URL')       ?? '',
    support_email: Deno.env.get('SMTP_FROM')      ?? '',
  }
  const merged = { ...globalVars, ...data }

  const renderedSubject  = render(subject,   merged)
  const renderedBody     = render(body_html, merged)

  // ── Resend (preferred) ────────────────────────────────────────────────────
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (resendKey) {
    const fromName  = merged.project_name
    const fromEmail = Deno.env.get('SMTP_FROM') ?? `noreply@${new URL(merged.site_url || 'http://localhost').hostname}`
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    `${fromName} <${fromEmail}>`,
        to:      [to],
        subject: renderedSubject,
        html:    renderedBody,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[send-email] Resend error:', err)
      return c.json({ error: `Resend: ${err}` }, 502)
    }
    return c.json({ ok: true, provider: 'resend' })
  }

  // ── SMTP via nodemailer ───────────────────────────────────────────────────
  const smtpHost = Deno.env.get('SMTP_HOST')
  if (smtpHost) {
    const nodemailer = await import('npm:nodemailer')
    const transporter = nodemailer.createTransport({
      host:   smtpHost,
      port:   Number(Deno.env.get('SMTP_PORT') ?? 587),
      secure: Deno.env.get('SMTP_SECURE') === 'true',
      auth:   Deno.env.get('SMTP_USER') ? {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      } : undefined,
    })
    try {
      await transporter.sendMail({
        from:    `"${merged.project_name}" <${Deno.env.get('SMTP_FROM') ?? 'noreply@localhost'}>`,
        to,
        subject: renderedSubject,
        html:    renderedBody,
      })
      return c.json({ ok: true, provider: 'smtp' })
    } catch (err) {
      console.error('[send-email] SMTP error:', err)
      return c.json({ error: `SMTP: ${err instanceof Error ? err.message : String(err)}` }, 502)
    }
  }

  // ── Dev mode: log and skip ────────────────────────────────────────────────
  console.log('[send-email] No provider configured — would send:')
  console.log(`  To:      ${to}`)
  console.log(`  Subject: ${renderedSubject}`)
  console.log(`  Body:    ${renderedBody.slice(0, 200)}…`)
  return c.json({ ok: true, skipped: true, reason: 'no provider configured (set RESEND_API_KEY or SMTP_HOST)' })
})

Deno.serve(app.fetch)
