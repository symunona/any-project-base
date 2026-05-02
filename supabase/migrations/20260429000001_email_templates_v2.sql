-- Migration: email_templates_v2
-- Adds body_html, variables (per-template var definitions), type (app|auth).
-- Seeds default HTML bodies for all 12 templates (6 existing app + 5 auth + 1 system_update).
-- Auth templates use {{mustache}} syntax in the DB; `just sync-auth-templates` exports them
-- to supabase/templates/*.html using Go template syntax ({{ .ConfirmationURL }} etc.).

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS body_html  TEXT,
  ADD COLUMN IF NOT EXISTS variables  JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS type       TEXT  NOT NULL DEFAULT 'app';

-- ─── Base HTML helper ──────────────────────────────────────���───────────────
-- All templates share this single-column table layout.
-- Header: indigo band with project name.
-- Body: white card, padding 32px 40px.
-- Footer: light band with copyright line + optional custom_footer.
-- Variables in body_html use {{name}} Mustache syntax.
-- GLOBAL vars (always injected on send): {{project_name}}, {{site_url}}, {{support_email}}.
-- Per-template vars are listed in the variables JSONB column.

-- ─── App templates ────────────────────────────────────────────────────────

UPDATE public.email_templates SET
  type = 'app',
  variables = '[
    {"name":"user_name",    "description":"Recipient display name",           "example":"Jane"},
    {"name":"project_name", "description":"Your product name (global)",        "example":"Acme"},
    {"name":"site_url",     "description":"Root URL of the site (global)",     "example":"https://acme.com"}
  ]'::jsonb,
  body_html = $html$<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#4f46e5;padding:24px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{project_name}}</p></td></tr><tr><td style="padding:32px 40px 28px;"><h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Welcome, {{user_name}}!</h2><p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Thanks for joining {{project_name}}. Your account is ready — click below to get started.</p><a href="{{site_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Open {{project_name}} →</a></td></tr><tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">You're receiving this because you created an account with {{project_name}}.</p></td></tr></table></td></tr></table></body></html>$html$
WHERE id = 'welcome';

UPDATE public.email_templates SET
  type = 'app',
  variables = '[
    {"name":"user_name",    "description":"Recipient display name",           "example":"Jane"},
    {"name":"reset_url",    "description":"One-time password reset link",     "example":"https://acme.com/reset?token=abc123"},
    {"name":"project_name", "description":"Your product name (global)",        "example":"Acme"},
    {"name":"site_url",     "description":"Root URL of the site (global)",     "example":"https://acme.com"}
  ]'::jsonb,
  body_html = $html$<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#4f46e5;padding:24px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{project_name}}</p></td></tr><tr><td style="padding:32px 40px 28px;"><h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Reset your password</h2><p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Hi {{user_name}},<br><br>Click the button below to choose a new password. This link expires in 24&nbsp;hours.</p><a href="{{reset_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Reset password</a><p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">If you didn't request this, you can safely ignore this email.</p></td></tr><tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">© {{project_name}} · <a href="{{site_url}}" style="color:#9ca3af;text-decoration:none;">{{site_url}}</a></p></td></tr></table></td></tr></table></body></html>$html$
WHERE id = 'password_reset';

UPDATE public.email_templates SET
  type = 'app',
  variables = '[
    {"name":"user_name",    "description":"Recipient display name",           "example":"Jane"},
    {"name":"ticket_id",    "description":"Support ticket/conversation ID",   "example":"1042"},
    {"name":"reply_text",   "description":"The support team reply text",      "example":"Hi, we looked into your issue and..."},
    {"name":"support_url",  "description":"Link to open the conversation",    "example":"https://acme.com/support/1042"},
    {"name":"project_name", "description":"Your product name (global)",        "example":"Acme"},
    {"name":"site_url",     "description":"Root URL of the site (global)",     "example":"https://acme.com"}
  ]'::jsonb,
  body_html = $html$<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#4f46e5;padding:24px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{project_name}}</p></td></tr><tr><td style="padding:32px 40px 28px;"><h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">New reply to your request</h2><p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi {{user_name}},<br><br>The support team replied to request <strong>#{{ticket_id}}</strong>:</p><blockquote style="margin:0 0 24px;padding:16px 20px;background:#f3f4f6;border-left:4px solid #4f46e5;border-radius:0 4px 4px 0;font-size:14px;color:#374151;line-height:1.6;">{{reply_text}}</blockquote><a href="{{support_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View full conversation</a></td></tr><tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">© {{project_name}} · <a href="{{site_url}}" style="color:#9ca3af;text-decoration:none;">{{site_url}}</a></p></td></tr></table></td></tr></table></body></html>$html$
WHERE id = 'support_reply';

UPDATE public.email_templates SET
  type = 'app',
  variables = '[
    {"name":"user_name",       "description":"Recipient display name",             "example":"Jane"},
    {"name":"credits_balance", "description":"Current credit balance",             "example":"0"},
    {"name":"buy_credits_url", "description":"Link to buy more credits",           "example":"https://acme.com/buy-credits"},
    {"name":"project_name",    "description":"Your product name (global)",          "example":"Acme"},
    {"name":"site_url",        "description":"Root URL of the site (global)",       "example":"https://acme.com"}
  ]'::jsonb,
  body_html = $html$<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#4f46e5;padding:24px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{project_name}}</p></td></tr><tr><td style="padding:32px 40px 28px;"><h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">You're out of credits</h2><p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Hi {{user_name}},<br><br>Your {{project_name}} credit balance is <strong>{{credits_balance}}</strong>. Top up to continue using the service.</p><a href="{{buy_credits_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Buy credits</a></td></tr><tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">© {{project_name}} · <a href="{{site_url}}" style="color:#9ca3af;text-decoration:none;">{{site_url}}</a></p></td></tr></table></td></tr></table></body></html>$html$
WHERE id = 'credit_depletion';

UPDATE public.email_templates SET
  type = 'app',
  variables = '[
    {"name":"user_name",    "description":"Recipient display name",           "example":"Jane"},
    {"name":"amount",       "description":"Failed payment amount",            "example":"$20.00"},
    {"name":"retry_url",    "description":"Link to update payment method",    "example":"https://acme.com/billing"},
    {"name":"project_name", "description":"Your product name (global)",        "example":"Acme"},
    {"name":"site_url",     "description":"Root URL of the site (global)",     "example":"https://acme.com"}
  ]'::jsonb,
  body_html = $html$<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#dc2626;padding:24px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{project_name}}</p></td></tr><tr><td style="padding:32px 40px 28px;"><h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#dc2626;">Payment failed</h2><p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Hi {{user_name}},<br><br>We couldn't process your payment of <strong>{{amount}}</strong>. Please update your payment method to keep your access.</p><a href="{{retry_url}}" style="display:inline-block;background:#dc2626;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Update payment method</a></td></tr><tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">© {{project_name}} · <a href="{{site_url}}" style="color:#9ca3af;text-decoration:none;">{{site_url}}</a></p></td></tr></table></td></tr></table></body></html>$html$
WHERE id = 'payment_failed';

UPDATE public.email_templates SET
  type = 'app',
  variables = '[
    {"name":"user_name",    "description":"Recipient display name",           "example":"Jane"},
    {"name":"login_url",    "description":"One-time magic sign-in link",      "example":"https://acme.com/auth/confirm?token=abc"},
    {"name":"project_name", "description":"Your product name (global)",        "example":"Acme"},
    {"name":"site_url",     "description":"Root URL of the site (global)",     "example":"https://acme.com"}
  ]'::jsonb,
  body_html = $html$<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#4f46e5;padding:24px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{project_name}}</p></td></tr><tr><td style="padding:32px 40px 28px;"><h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Your sign-in link</h2><p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Hi {{user_name}},<br><br>Click below to sign in to {{project_name}}. This link is single-use and expires in 1&nbsp;hour.</p><a href="{{login_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Sign in to {{project_name}}</a><p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">If you didn't request this, ignore this email.</p></td></tr><tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">© {{project_name}} · <a href="{{site_url}}" style="color:#9ca3af;text-decoration:none;">{{site_url}}</a></p></td></tr></table></td></tr></table></body></html>$html$
WHERE id = 'magic_link';

-- ─── system_update (new) ──────────────────────────────────────────────────
INSERT INTO public.email_templates (id, subject, type, variables, body_html)
VALUES (
  'system_update',
  'Update from {{project_name}}: {{title}}',
  'app',
  '[
    {"name":"user_name",    "description":"Recipient display name",            "example":"Jane"},
    {"name":"title",        "description":"Message headline (also in subject)","example":"We just launched dark mode"},
    {"name":"message",      "description":"Main message body (HTML allowed)",  "example":"<p>We worked hard on this...</p>"},
    {"name":"project_name", "description":"Your product name (global)",         "example":"Acme"},
    {"name":"site_url",     "description":"Root URL of the site (global)",      "example":"https://acme.com"}
  ]'::jsonb,
  $html$<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#4f46e5;padding:24px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{project_name}}</p></td></tr><tr><td style="padding:32px 40px 28px;"><h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">{{title}}</h2><p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Hi {{user_name}},</p><div style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 28px;">{{message}}</div><a href="{{site_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Open {{project_name}}</a></td></tr><tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">You're receiving this because you have an account with {{project_name}}. <a href="{{site_url}}" style="color:#9ca3af;text-decoration:none;">{{site_url}}</a></p></td></tr></table></td></tr></table></body></html>$html$
) ON CONFLICT (id) DO NOTHING;

-- ─── Auth templates (Supabase-controlled) ────────────────────────────────
-- type = 'auth'. Variables use {{mustache}} syntax mapped to Go on export.
-- Mapping applied by `just sync-auth-templates`:
--   {{confirmation_url}} → {{ .ConfirmationURL }}
--   {{site_url}}         → {{ .SiteURL }}
--   {{token}}            → {{ .Token }}
--   {{email}}            → {{ .Email }}
--   {{new_email}}        → {{ .NewEmail }}
-- These are sent by Supabase's own auth system, NOT by send-email.
-- Editing here requires re-exporting + redeploying to take effect.

INSERT INTO public.email_templates (id, subject, type, variables, body_html) VALUES
(
  'auth_invite',
  'You''ve been invited to join {{project_name}}',
  'auth',
  '[
    {"name":"confirmation_url","description":"Supabase invite accept URL",          "example":"https://acme.supabase.co/auth/v1/verify?token=...","supabase_go":"{{ .ConfirmationURL }}"},
    {"name":"site_url",        "description":"Your site root URL",                  "example":"https://acme.com",                                  "supabase_go":"{{ .SiteURL }}"}
  ]'::jsonb,
  $html$<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#4f46e5;padding:24px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{project_name}}</p></td></tr><tr><td style="padding:32px 40px 28px;"><h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">You've been invited</h2><p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">You've been invited to join {{project_name}}. Click the button below to accept and create your account.</p><a href="{{confirmation_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Accept invitation</a><p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">This link expires in 24&nbsp;hours.</p></td></tr><tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">© {{project_name}} · <a href="{{site_url}}" style="color:#9ca3af;text-decoration:none;">{{site_url}}</a></p></td></tr></table></td></tr></table></body></html>$html$
),
(
  'auth_recovery',
  'Reset your password',
  'auth',
  '[
    {"name":"confirmation_url","description":"Supabase password reset URL",         "example":"https://acme.supabase.co/auth/v1/verify?token=...","supabase_go":"{{ .ConfirmationURL }}"},
    {"name":"site_url",        "description":"Your site root URL",                  "example":"https://acme.com",                                  "supabase_go":"{{ .SiteURL }}"}
  ]'::jsonb,
  $html$<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#4f46e5;padding:24px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{project_name}}</p></td></tr><tr><td style="padding:32px 40px 28px;"><h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Reset your password</h2><p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Someone requested a password reset for your account. Click below to set a new password.</p><a href="{{confirmation_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Reset password</a><p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">If you didn't request this, you can safely ignore this email.</p></td></tr><tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">© {{project_name}} · <a href="{{site_url}}" style="color:#9ca3af;text-decoration:none;">{{site_url}}</a></p></td></tr></table></td></tr></table></body></html>$html$
),
(
  'auth_magic_link',
  'Your sign-in link',
  'auth',
  '[
    {"name":"confirmation_url","description":"Supabase magic-link sign-in URL",     "example":"https://acme.supabase.co/auth/v1/verify?token=...","supabase_go":"{{ .ConfirmationURL }}"},
    {"name":"site_url",        "description":"Your site root URL",                  "example":"https://acme.com",                                  "supabase_go":"{{ .SiteURL }}"}
  ]'::jsonb,
  $html$<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#4f46e5;padding:24px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{project_name}}</p></td></tr><tr><td style="padding:32px 40px 28px;"><h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Your sign-in link</h2><p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Click below to sign in. This link is single-use and expires in 1&nbsp;hour.</p><a href="{{confirmation_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Sign in</a><p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">If you didn't request this, ignore this email.</p></td></tr><tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">© {{project_name}} · <a href="{{site_url}}" style="color:#9ca3af;text-decoration:none;">{{site_url}}</a></p></td></tr></table></td></tr></table></body></html>$html$
),
(
  'auth_confirmation',
  'Confirm your email address',
  'auth',
  '[
    {"name":"confirmation_url","description":"Supabase email confirmation URL",     "example":"https://acme.supabase.co/auth/v1/verify?token=...","supabase_go":"{{ .ConfirmationURL }}"},
    {"name":"site_url",        "description":"Your site root URL",                  "example":"https://acme.com",                                  "supabase_go":"{{ .SiteURL }}"}
  ]'::jsonb,
  $html$<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#4f46e5;padding:24px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{project_name}}</p></td></tr><tr><td style="padding:32px 40px 28px;"><h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Confirm your email address</h2><p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Thanks for signing up. Please confirm your email address to activate your account.</p><a href="{{confirmation_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Confirm email</a><p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">If you didn't create this account, ignore this email.</p></td></tr><tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">© {{project_name}} · <a href="{{site_url}}" style="color:#9ca3af;text-decoration:none;">{{site_url}}</a></p></td></tr></table></td></tr></table></body></html>$html$
),
(
  'auth_email_change',
  'Confirm your email change',
  'auth',
  '[
    {"name":"confirmation_url","description":"Supabase email-change confirmation URL","example":"https://acme.supabase.co/auth/v1/verify?token=...","supabase_go":"{{ .ConfirmationURL }}"},
    {"name":"new_email",       "description":"The new email address requested",      "example":"jane.new@example.com",                              "supabase_go":"{{ .NewEmail }}"},
    {"name":"site_url",        "description":"Your site root URL",                   "example":"https://acme.com",                                  "supabase_go":"{{ .SiteURL }}"}
  ]'::jsonb,
  $html$<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background:#4f46e5;padding:24px 40px;"><p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{project_name}}</p></td></tr><tr><td style="padding:32px 40px 28px;"><h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Confirm your email change</h2><p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">You requested to change your email address to <strong>{{new_email}}</strong>. Click below to confirm.</p><a href="{{confirmation_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Confirm email change</a><p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">If you didn't request this, ignore this email.</p></td></tr><tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;"><p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">© {{project_name}} · <a href="{{site_url}}" style="color:#9ca3af;text-decoration:none;">{{site_url}}</a></p></td></tr></table></td></tr></table></body></html>$html$
)
ON CONFLICT (id) DO NOTHING;
