// Email wrapper — Resend/SMTP inside. Never call email provider SDK directly in app code.
// This module is server-side only (used in edge functions, not frontend).

type EmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const smtpHost = Deno?.env?.get?.('SMTP_HOST')
  if (!smtpHost) {
    console.warn('[email] SMTP_HOST not set — email skipped')
    return
  }
  // Implementation: wire to Resend or nodemailer depending on env.
  // Placeholder — implement in edge function send-email/index.ts.
  throw new Error('email.ts: implement send logic in supabase/functions/send-email/index.ts')
}

// Deno global for edge function context
declare const Deno: { env: { get: (k: string) => string | undefined } } | undefined
