# Email Architecture

## Stack

**React Email** — write email templates as React components, renders to bulletproof HTML + plain text.
**`commons/lib/email.ts`** — wrapper around email provider (Resend default). Never call provider SDK directly.

## Templates

All templates live in `commons/email-templates/`. Each is a React Email component.
Layout, styling, logo, unsubscribe footer = shared via `EmailLayout.tsx`.

### Template list

| ID | Trigger | Subject (default) |
|----|---------|-------------------|
| `welcome` | new user signup | Welcome to {{project_name}} |
| `password_reset` | forgot password | Reset your password |
| `support_reply` | admin replies to ticket | New reply to your support request |
| `credit_depletion` | credits hit zero | You're out of credits |
| `payment_failed` | Stripe invoice.payment_failed | Payment failed — action required |
| `magic_link` | admin generates client link | Your login link |

### Adding a new template

1. Create `commons/email-templates/MyTemplate.tsx`
2. Add row to `email_templates` migration
3. Add case to `commons/lib/email.ts` `send()` switch
4. Add to template list above

## DB: email_templates table

Stores admin-editable metadata only. HTML layout = code only (never editable in admin — prevents broken emails).

```sql
email_templates (
  id            text primary key,   -- matches template file name
  subject       text not null,      -- editable in admin
  sender_name   text not null,      -- editable in admin
  enabled       bool not null,      -- toggle per template in admin
  custom_footer text,               -- appended to email footer, editable in admin
  updated_at    timestamptz
)
```

## commons/lib/email.ts wrapper

```typescript
export const email = {
  send: async (templateId: string, to: string, props: Record<string, unknown>) => {
    // 1. fetch template metadata from email_templates table
    const template = await getTemplate(templateId)
    if (!template.enabled) return  // silently skip disabled templates

    // 2. render React Email component to HTML + text
    const html = await renderToHtml(templateId, { ...props, custom_footer: template.custom_footer })
    const text = await renderToText(templateId, props)

    // 3. send via provider (Resend by default)
    await provider.send({
      from: `${template.sender_name} <noreply@${config.domain}>`,
      to,
      subject: interpolate(template.subject, props),  // replace {{vars}}
      html,
      text,
    })
  }
}

// usage — always via wrapper, never raw SDK
await email.send('support_reply', user.email, { ticket_subject: '...' })
```

## EmailLayout.tsx

Shared wrapper for all templates:
- Project logo (from branding) in header
- Consistent typography + colors from theme
- `custom_footer` from DB appended if set
- Unsubscribe link always in footer (links to `/settings/profile` → notification settings)
- Plain text fallback rendered alongside HTML

## Admin UI — email template management

Under System → Email Templates:
- List of all templates with enabled toggle
- Click to edit: subject line, sender name, custom footer text
- Preview button: renders template with sample data in new tab (calls `GET /api/admin/email-templates/:id/preview`)
- No HTML editor — layout is code-only

## Provider swap

Default: Resend (`npm:resend` in edge function).
To swap: change implementation in `commons/lib/email.ts` only.
All call sites unchanged.

Setup: `setup/platform/email_setup.sh` — walks through getting Resend API key, validates it, writes to `.env.local`.

## Checker

`setup/checks/email_check.sh`:
- All template IDs in `email_templates` migration have matching `commons/email-templates/[Id].tsx`
- No direct Resend/Nodemailer/SMTP imports outside `commons/lib/email.ts`
- `email_templates` migration has all 6 default rows seeded
