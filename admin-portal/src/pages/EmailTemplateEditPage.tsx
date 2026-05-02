import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApi, Button, Card, CardBody, PageHeader, Input, useNotification, NotificationContainer, Textarea } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import type { EmailTemplate, TemplateVariable } from '@any-project-base/commons'
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info, Terminal } from 'lucide-react'

// ─── Auth template variable mapping reference ─────────────────────────────
const AUTH_VAR_MAP: Record<string, string> = {
  confirmation_url: '{{ .ConfirmationURL }}',
  site_url:         '{{ .SiteURL }}',
  token:            '{{ .Token }}',
  email:            '{{ .Email }}',
  new_email:        '{{ .NewEmail }}',
}

const GLOBAL_VARS: TemplateVariable[] = [
  { name: 'project_name',  description: 'Your product name, from env PROJECT_NAME', example: 'Acme' },
  { name: 'site_url',      description: 'Root URL of the site, from env SITE_URL',   example: 'https://acme.com' },
  { name: 'support_email', description: 'Support address, from env SMTP_FROM',       example: 'support@acme.com' },
]

// ─── Validators ───────────────────────────────────────────────────────────

type ValidationResult = { warnings: string[]; errors: string[] }

function validateAppTemplate(subject: string, body: string, vars: TemplateVariable[]): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []
  const allKnown = new Set([...vars.map(v => v.name), ...GLOBAL_VARS.map(v => v.name)])
  const used = [...(subject + body).matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1] ?? '')
  // Unknown vars in body/subject
  for (const v of used) {
    if (v && !allKnown.has(v)) warnings.push(`Unknown variable {{${v}}} — it won't be replaced when sent`)
  }
  // Go syntax accidentally used
  if (/\{\{[ .]/.test(subject + body)) errors.push('Go template syntax detected ({{ .X }}). App templates must use {{variable_name}} Mustache syntax only')
  return { warnings, errors }
}

function validateAuthTemplate(subject: string, body: string): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []
  const knownAuthVars = new Set(Object.keys(AUTH_VAR_MAP))
  const used = [...(subject + body).matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1] ?? '')
  // Unknown auth variables
  for (const v of used) {
    if (v && !knownAuthVars.has(v) && !GLOBAL_VARS.map(g => g.name).includes(v)) {
      warnings.push(`{{${v}}} is not a known auth variable — Supabase won't substitute it`)
    }
  }
  // Go syntax accidentally used (must use Mustache in the DB)
  if (/\{\{[ .]/.test(subject + body)) {
    errors.push('Go template syntax ({{ .X }}) detected. Store Mustache {{variable}} syntax here — the export script converts to Go syntax automatically')
  }
  return { warnings, errors }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function renderPreview(body: string, vars: TemplateVariable[]): string {
  const sampleData: Record<string, string> = {}
  for (const v of [...GLOBAL_VARS, ...vars]) sampleData[v.name] = v.example
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => sampleData[key] ?? `<span style="background:#fef3c7;color:#92400e;padding:1px 4px;border-radius:3px;">{{${key}}}</span>`)
}

function insertAtCursor(ref: React.RefObject<HTMLTextAreaElement | null>, text: string, onChange: (v: string) => void) {
  const el = ref.current
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const next = el.value.slice(0, start) + text + el.value.slice(end)
  onChange(next)
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(start + text.length, start + text.length)
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────

function ValidationBanner({ result }: { result: ValidationResult }) {
  if (!result.errors.length && !result.warnings.length) return null
  return (
    <div className="space-y-2">
      {result.errors.map((e, i) => (
        <div key={i} className="flex gap-2 items-start p-3 rounded-lg bg-[var(--color-danger)]/8 text-[var(--color-danger)] text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{e}</span>
        </div>
      ))}
      {result.warnings.map((w, i) => (
        <div key={i} className="flex gap-2 items-start p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{w}</span>
        </div>
      ))}
    </div>
  )
}

function VarChip({ v, onInsert }: { v: TemplateVariable; onInsert: (s: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => { onInsert(`{{${v.name}}}`) }}
      title={`${v.description} — example: "${v.example}"`}
      className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--color-border)]
                 bg-[var(--color-surface-2)] hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/40
                 text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all"
    >
      <span className="font-semibold text-[var(--color-primary)]/70 group-hover:text-[var(--color-primary)]">{'{{'}</span>
      {v.name}
      <span className="font-semibold text-[var(--color-primary)]/70 group-hover:text-[var(--color-primary)]">{'}}'}</span>
    </button>
  )
}

function HelpSection({ type, vars }: { type: 'app' | 'auth'; vars: TemplateVariable[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
      <button
        type="button"
        onClick={() => { setOpen(v => !v) }}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-[var(--color-surface-2)] text-sm font-medium hover:bg-[var(--color-border)]/40 transition-colors"
      >
        <span className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <Info size={15} />
          How this template works
        </span>
        {open ? <ChevronUp size={16} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={16} className="text-[var(--color-text-muted)]" />}
      </button>
      {open && (
        <div className="px-5 py-5 space-y-5 text-sm text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
          {type === 'app' ? (
            <>
              <section className="space-y-1.5">
                <h4 className="font-semibold text-[var(--color-text)]">App template — sent by your send-email function</h4>
                <p>This email is sent programmatically by your backend when the corresponding event occurs (e.g. a support reply is posted, credits run out). Changes take effect <strong>immediately</strong> on the next send — no deploy required.</p>
              </section>
              <section className="space-y-1.5">
                <h4 className="font-semibold text-[var(--color-text)]">Variable syntax: <code className="bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded text-xs font-mono">{`{{variable_name}}`}</code></h4>
                <p>Variables are replaced at send time with real data. Unknown variables are left as-is (shown highlighted in yellow in the preview). Variable names are case-sensitive and must be lowercase snake_case.</p>
              </section>
              <section className="space-y-2">
                <h4 className="font-semibold text-[var(--color-text)]">Global variables — always available</h4>
                <p>These are injected on every send regardless of template:</p>
                <table className="w-full text-xs border border-[var(--color-border)] rounded-lg overflow-hidden">
                  <thead className="bg-[var(--color-surface-2)]">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Variable</th>
                      <th className="px-3 py-2 text-left font-semibold">Source</th>
                      <th className="px-3 py-2 text-left font-semibold">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GLOBAL_VARS.map(v => (
                      <tr key={v.name} className="border-t border-[var(--color-border)]">
                        <td className="px-3 py-2 font-mono text-[var(--color-primary)]">{`{{${v.name}}}`}</td>
                        <td className="px-3 py-2">{v.description}</td>
                        <td className="px-3 py-2 text-[var(--color-text)]">{v.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section className="space-y-2">
                <h4 className="font-semibold text-[var(--color-text)]">Template-specific variables</h4>
                <p>This template also has these variables (click a chip above the editor to insert):</p>
                <table className="w-full text-xs border border-[var(--color-border)] rounded-lg overflow-hidden">
                  <thead className="bg-[var(--color-surface-2)]">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Variable</th>
                      <th className="px-3 py-2 text-left font-semibold">Description</th>
                      <th className="px-3 py-2 text-left font-semibold">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vars.map(v => (
                      <tr key={v.name} className="border-t border-[var(--color-border)]">
                        <td className="px-3 py-2 font-mono text-[var(--color-primary)]">{`{{${v.name}}}`}</td>
                        <td className="px-3 py-2">{v.description}</td>
                        <td className="px-3 py-2 text-[var(--color-text)]">{v.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section className="space-y-1.5">
                <h4 className="font-semibold text-[var(--color-text)]">Email HTML tips</h4>
                <ul className="list-disc list-inside space-y-1 text-[var(--color-text-muted)]">
                  <li>Use <strong>inline styles</strong> — most email clients strip <code className="bg-[var(--color-surface-2)] px-1 rounded text-xs">&lt;style&gt;</code> tags</li>
                  <li>Use <strong>table-based layouts</strong> for complex multi-column designs</li>
                  <li>Keep max-width around <strong>600px</strong> for best mobile rendering</li>
                  <li>Avoid CSS classes, flexbox, and grid — Outlook ignores them</li>
                  <li>Always test in multiple clients (Gmail, Outlook, Apple Mail)</li>
                </ul>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-1.5">
                <h4 className="font-semibold text-[var(--color-text)]">Auth template — sent by Supabase's auth system</h4>
                <p>This email is sent <strong>directly by Supabase</strong> (not your send-email function) during auth flows: sign up, password reset, magic link, invite, and email change. You are editing it here for branding consistency, but the template is stored in <code className="bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded text-xs font-mono">supabase/templates/</code> as Go HTML files.</p>
              </section>
              <section className="space-y-1.5 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex gap-2 items-start">
                  <Terminal size={15} className="text-amber-700 mt-0.5 shrink-0" />
                  <div className="text-amber-700">
                    <p className="font-semibold mb-1">Changes require a redeploy</p>
                    <p>After saving here, run the following to export to Supabase template files and restart the local stack:</p>
                    <pre className="mt-2 bg-amber-100 rounded p-2 text-xs font-mono">just sync-auth-templates</pre>
                    <p className="mt-2">In production, push to your deployment branch — the sync script runs automatically in CI.</p>
                  </div>
                </div>
              </section>
              <section className="space-y-1.5">
                <h4 className="font-semibold text-[var(--color-text)]">Variable syntax: <code className="bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded text-xs font-mono">{`{{variable_name}}`}</code></h4>
                <p>Write variables with Mustache syntax here — <strong>not</strong> Go template syntax. The export script automatically converts them to <code className="bg-[var(--color-surface-2)] px-1 rounded text-xs font-mono">{'{{ .GoVariable }}'}</code> when writing the <code className="bg-[var(--color-surface-2)] px-1 rounded text-xs font-mono">.html</code> files.</p>
              </section>
              <section className="space-y-2">
                <h4 className="font-semibold text-[var(--color-text)]">Available auth variables and their Go equivalents</h4>
                <p>Only these variables are available in auth templates — Supabase provides them:</p>
                <table className="w-full text-xs border border-[var(--color-border)] rounded-lg overflow-hidden">
                  <thead className="bg-[var(--color-surface-2)]">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Use in DB (Mustache)</th>
                      <th className="px-3 py-2 text-left font-semibold">Go file equivalent</th>
                      <th className="px-3 py-2 text-left font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(AUTH_VAR_MAP).map(([k, v]) => (
                      <tr key={k} className="border-t border-[var(--color-border)]">
                        <td className="px-3 py-2 font-mono text-[var(--color-primary)]">{`{{${k}}}`}</td>
                        <td className="px-3 py-2 font-mono text-emerald-700">{v}</td>
                        <td className="px-3 py-2">{k === 'confirmation_url' ? 'The one-time action URL (invite accept / reset / sign-in)' : k === 'site_url' ? 'Your site root URL' : k === 'token' ? 'Raw OTP/token (if needed for custom links)' : k === 'email' ? "The user's email address" : "The user's new email address (email change flow)"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section className="space-y-1.5">
                <h4 className="font-semibold text-[var(--color-text)]">No user_name in auth templates</h4>
                <p>Supabase's auth system does <strong>not</strong> provide the user's display name during auth emails — it only has the email address and tokens. If you need the name, use app-level emails (e.g. the <code className="bg-[var(--color-surface-2)] px-1 rounded text-xs font-mono">welcome</code> template triggered post-signup).</p>
              </section>
              <section className="space-y-1.5">
                <h4 className="font-semibold text-[var(--color-text)]">Email HTML tips</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Inline styles only — no <code className="bg-[var(--color-surface-2)] px-1 rounded text-xs">&lt;style&gt;</code> blocks</li>
                  <li>Max-width 600px, table-based layout for Outlook</li>
                  <li>Keep it short — auth emails are transactional</li>
                </ul>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─��─ Main page ────────────────────────────────────────────────────────────

type Tab = 'html' | 'preview'

export function EmailTemplateEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { notifications, notify, dismiss } = useNotification()

  const { data: tpl, isLoading } = useQuery<EmailTemplate>({
    queryKey: ['email-template', id],
    queryFn: () => fetchApi<EmailTemplate>(`${config.apiUrl}/email-templates/${id}`),
    enabled: Boolean(id),
  })

  const [subject, setSubject]         = useState('')
  const [senderName, setSenderName]   = useState('')
  const [enabled, setEnabled]         = useState(true)
  const [footer, setFooter]           = useState('')
  const [bodyHtml, setBodyHtml]       = useState('')
  const [tab, setTab]                 = useState<Tab>('html')
  const [saving, setSaving]           = useState(false)
  const [validation, setValidation]   = useState<ValidationResult>({ warnings: [], errors: [] })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!tpl) return
    setSubject(tpl.subject)
    setSenderName(tpl.sender_name)
    setEnabled(tpl.enabled)
    setFooter(tpl.custom_footer ?? '')
    setBodyHtml(tpl.body_html ?? '')
  }, [tpl])

  // Validate on body/subject change (debounced)
  useEffect(() => {
    if (!tpl) return
    const t = setTimeout(() => {
      setValidation(
        tpl.type === 'auth'
          ? validateAuthTemplate(subject, bodyHtml)
          : validateAppTemplate(subject, bodyHtml, tpl.variables),
      )
    }, 500)
    return () => { clearTimeout(t) }
  }, [subject, bodyHtml, tpl])

  const handleInsert = useCallback((text: string) => {
    insertAtCursor(textareaRef, text, setBodyHtml)
  }, [])

  const save = async () => {
    if (!id || validation.errors.length > 0) return
    setSaving(true)
    try {
      await fetchApi(`${config.apiUrl}/email-templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ subject, sender_name: senderName, enabled, custom_footer: footer || null, body_html: bodyHtml }),
      })
      await qc.invalidateQueries({ queryKey: ['email-templates'] })
      await qc.invalidateQueries({ queryKey: ['email-template', id] })
      notify({
        type: 'success',
        message: tpl?.type === 'auth'
          ? 'Saved. Run `just sync-auth-templates` to export to Supabase template files.'
          : 'Saved. Changes are live on the next send.',
      })
    } catch {
      notify({ type: 'error', message: 'Failed to save template.' })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <div className="p-8 text-[var(--color-text-muted)]">Loading…</div>
  if (!tpl) return <div className="p-8">Template not found.</div>

  const allVars = [...GLOBAL_VARS, ...tpl.variables]
  const previewHtml = renderPreview(bodyHtml, tpl.variables)

  const isAuthType = tpl.type === 'auth'

  const TEMPLATE_DISPLAY_NAMES: Record<string, string> = {
    welcome: 'Welcome', password_reset: 'Password Reset (app)', support_reply: 'Support Reply',
    credit_depletion: 'Credit Depletion', payment_failed: 'Payment Failed', magic_link: 'Magic Link (app)',
    system_update: 'System Update / Broadcast',
    auth_invite: 'Invite (Supabase auth)', auth_recovery: 'Password Reset (Supabase auth)',
    auth_magic_link: 'Magic Link (Supabase auth)', auth_confirmation: 'Email Confirmation (Supabase auth)',
    auth_email_change: 'Email Change (Supabase auth)',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={TEMPLATE_DISPLAY_NAMES[tpl.id] ?? tpl.id}
        subtitle={isAuthType ? 'Auth template — requires redeploy to take effect' : 'App template — changes are live immediately'}
        actions={
          <button
            onClick={() => { void navigate('/system?tab=templates') }}
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <ArrowLeft size={15} /> Back to templates
          </button>
        }
      />

      {/* Type banner */}
      {isAuthType ? (
        <div className="flex gap-3 items-start p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <Terminal size={16} className="mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Auth template — sent by Supabase, not your send-email function.</span>
            {' '}After saving, run <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">just sync-auth-templates</code> to export changes and restart the local stack. In production, push and redeploy.
          </div>
        </div>
      ) : (
        <div className="flex gap-3 items-start p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span><span className="font-semibold">App template — changes are live immediately.</span> The next time this email is triggered, the updated HTML will be used.</span>
        </div>
      )}

      <HelpSection type={tpl.type} vars={tpl.variables} />

      <Card>
        <CardBody>
          <div className="space-y-5">
            {/* Subject + sender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Subject line</label>
                <Input value={subject} onChange={e => { setSubject(e.target.value) }} placeholder="Your subject…" />
                <p className="text-xs text-[var(--color-text-muted)]">Supports <code className="bg-[var(--color-surface-2)] px-1 rounded">{'{{variables}}'}</code> — e.g. <code className="bg-[var(--color-surface-2)] px-1 rounded">{'{{project_name}}'}</code></p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Sender name</label>
                <Input value={senderName} onChange={e => { setSenderName(e.target.value) }} placeholder="e.g. Acme Support" />
              </div>
            </div>

            {/* Enabled toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setEnabled(v => !v) }}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors
                  ${enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
                role="switch" aria-checked={enabled}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">{enabled ? 'Enabled' : 'Disabled'}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{enabled ? 'This email will be sent when triggered' : 'Sends are silently skipped when disabled'}</p>
              </div>
            </div>

            {/* Variable chips */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                Available variables — click to insert at cursor
              </p>
              <div className="flex flex-wrap gap-2">
                {allVars.map(v => (
                  <VarChip key={v.name} v={v} onInsert={handleInsert} />
                ))}
              </div>
              {isAuthType && (
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Auth variables are provided by Supabase. <span className="font-medium">Do not use app variables like <code className="bg-[var(--color-surface-2)] px-1 rounded">{'{{user_name}}'}</code></span> — Supabase doesn't have them at auth time.
                </p>
              )}
            </div>

            {/* Validation */}
            <ValidationBanner result={validation} />

            {/* Editor + Preview tabs */}
            <div className="space-y-0">
              <div className="flex gap-0 border-b border-[var(--color-border)]">
                {(['html', 'preview'] as Tab[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTab(t) }}
                    className={[
                      'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                      tab === t
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                    ].join(' ')}
                  >
                    {t === 'html' ? 'HTML source' : 'Preview (sample data)'}
                  </button>
                ))}
              </div>
              <div className="pt-3">
                {tab === 'html' ? (
                  <div className="space-y-1.5">
                    <Textarea
                      ref={textareaRef}
                      value={bodyHtml}
                      onChange={e => { setBodyHtml(e.target.value) }}
                      rows={20}
                      className="font-mono text-xs leading-relaxed"
                      placeholder="<!DOCTYPE html><html>…</html>"
                      spellCheck={false}
                    />
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Raw HTML. Use inline styles. <code className="bg-[var(--color-surface-2)] px-1 rounded">{'{{variable}}'}</code> placeholders are replaced at send time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ height: 480 }}>
                      <iframe
                        srcDoc={previewHtml}
                        className="w-full h-full"
                        sandbox="allow-same-origin"
                        title="Email preview"
                      />
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Variables are substituted with example values. Unknown variables are highlighted in yellow.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Custom footer */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Custom footer text</label>
              <Textarea
                value={footer}
                onChange={e => { setFooter(e.target.value) }}
                rows={2}
                placeholder="Optional — appended to the email footer. E.g. 'Acme Inc., 123 Main St, Springfield'"
              />
            </div>

            {/* Save */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-[var(--color-text-muted)]">
                Last updated: {new Date(tpl.updated_at).toLocaleString()}
              </div>
              <Button
                onClick={() => { void save() }}
                loading={saving}
                disabled={validation.errors.length > 0}
              >
                Save template
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}
