import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchApi, Button, Card, CardBody, CardHeader, PageHeader, Input, Textarea, useNotification, NotificationContainer, Modal, Badge } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import type { User, EmailTemplate } from '@any-project-base/commons'
import { Trash2, Eye, Send, Users, Info } from 'lucide-react'

// ─── Draft persistence ────────────────────────────────────────────────────

const DRAFT_KEY = 'admin_broadcast_draft'

type BroadcastDraft = {
  subject:      string
  title:        string
  message:      string
  filter_roles: string[]
  savedAt:      string
}

function saveDraft(d: Omit<BroadcastDraft, 'savedAt'>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, savedAt: new Date().toISOString() }))
  } catch { /* blocked */ }
}

function loadDraft(): BroadcastDraft | null {
  try {
    const s = localStorage.getItem(DRAFT_KEY)
    return s ? JSON.parse(s) as BroadcastDraft : null
  } catch { return null }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY) } catch { /* blocked */ }
}

// ─── Variable rendering ───────────────────────────────────────────────────

function renderForUser(html: string, user: User, title: string, message: string): string {
  const data: Record<string, string> = {
    user_name:    user.name ?? user.email,
    title,
    message,
    project_name: config.projectName,
    site_url:     window.location.origin,
  }
  return html.replace(/\{\{(\w+)\}\}/g, (_, key: string) => data[key] ?? `{{${key}}}`)
}

const ALL_ROLES = ['user', 'admin', 'support']

// ─── Sub-components ───────────────────────────────────────────────────────

function RoleFilter({ selected, onChange }: { selected: string[]; onChange: (r: string[]) => void }) {
  const toggle = (role: string) => {
    onChange(selected.includes(role) ? selected.filter(r => r !== role) : [...selected, role])
  }
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Recipient roles</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { onChange(selected.length === ALL_ROLES.length ? [] : ALL_ROLES) }}
          className={[
            'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
            selected.length === ALL_ROLES.length
              ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/50',
          ].join(' ')}
        >
          All users
        </button>
        {ALL_ROLES.map(role => (
          <button
            key={role}
            type="button"
            onClick={() => { toggle(role) }}
            className={[
              'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize',
              selected.includes(role)
                ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/50',
            ].join(' ')}
          >
            {role}
          </button>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-[var(--color-danger)]">No roles selected — no one will receive this message.</p>
      )}
    </div>
  )
}

function SampleUserRow({ user, onPreview }: { user: User; onPreview: (u: User) => void }) {
  return (
    <button
      type="button"
      onClick={() => { onPreview(user) }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors text-left group"
    >
      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-xs font-bold text-[var(--color-primary)] shrink-0">
        {(user.name ?? user.email).charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text)] truncate">{user.name ?? '—'}</p>
        <p className="text-xs text-[var(--color-text-muted)] truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'support' ? 'warning' : 'neutral'}>
          {user.role}
        </Badge>
        <Eye size={14} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────

export function BroadcastPage() {
  const { notifications, notify, dismiss } = useNotification()

  // Restore draft on mount
  const savedDraft = loadDraft()
  const [subject, setSubject]       = useState(savedDraft?.subject ?? '')
  const [title, setTitle]           = useState(savedDraft?.title ?? '')
  const [message, setMessage]       = useState(savedDraft?.message ?? '')
  const [filterRoles, setFilterRoles] = useState<string[]>(savedDraft?.filter_roles ?? ALL_ROLES)
  const [hasDraft]                  = useState(Boolean(savedDraft))
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending]       = useState(false)
  const [previewUser, setPreviewUser] = useState<User | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Auto-save draft on changes
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (subject || title || message) {
        saveDraft({ subject, title, message, filter_roles: filterRoles })
      }
    }, 800)
    return () => { clearTimeout(saveTimer.current) }
  }, [subject, title, message, filterRoles])

  const discardDraft = useCallback(() => {
    clearDraft()
    setSubject('')
    setTitle('')
    setMessage('')
    setFilterRoles(ALL_ROLES)
  }, [])

  // Preview audience
  const rolesQuery = filterRoles.join(',')
  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ['broadcast-preview', rolesQuery],
    queryFn: () => fetchApi<{ count: number; sample: User[] }>(
      `${config.apiUrl}/broadcasts/preview${filterRoles.length ? `?roles=${rolesQuery}` : ''}`,
    ),
    enabled: filterRoles.length > 0,
  })

  // system_update template for live preview
  const { data: tpl } = useQuery<EmailTemplate>({
    queryKey: ['email-template', 'system_update'],
    queryFn: () => fetchApi<EmailTemplate>(`${config.apiUrl}/email-templates/system_update`),
  })

  const send = async () => {
    if (!tpl?.body_html) return
    setSending(true)
    try {
      const rendered = renderForUser(tpl.body_html, { name: '{{user_name}}', email: '' } as User, title, message)
      const res = await fetchApi<{ sent: number; failed: number; errors: string[] }>(
        `${config.apiUrl}/broadcasts/send`,
        {
          method: 'POST',
          body: JSON.stringify({
            subject: subject || tpl.subject.replace('{{title}}', title),
            body_html: rendered,
            filter: { roles: filterRoles },
          }),
        },
      )
      notify({
        type: res.failed === 0 ? 'success' : 'error',
        message: `Sent to ${res.sent} user${res.sent !== 1 ? 's' : ''}${res.failed > 0 ? `. ${res.failed} failed.` : '.'}`,
      })
      if (res.sent > 0) clearDraft()
      setConfirmOpen(false)
    } catch {
      notify({ type: 'error', message: 'Broadcast failed. Check send-email configuration.' })
    } finally {
      setSending(false)
    }
  }

  const canSend = subject.trim() && title.trim() && message.trim() && filterRoles.length > 0 && (preview?.count ?? 0) > 0

  const recipientCount = filterRoles.length === 0 ? 0 : (preview?.count ?? 0)

  // Variable preview values for the selected user (or generic fallback)
  const varValues = (u: User | null) => [
    { name: 'user_name',    value: u ? (u.name ?? u.email) : "(each recipient's name)" },
    { name: 'title',        value: title || '(your title)' },
    { name: 'message',      value: message ? message.slice(0, 60) + (message.length > 60 ? '…' : '') : '(your message)' },
    { name: 'project_name', value: config.projectName },
    { name: 'site_url',     value: window.location.origin },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Send System Message"
        subtitle="Compose a broadcast email to a filtered group of users"
      />

      {/* Draft restored notice */}
      {hasDraft && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--color-primary)]/6 border border-[var(--color-primary)]/20">
          <div className="flex items-center gap-2 text-sm text-[var(--color-primary)]">
            <Info size={15} />
            <span>Draft restored from {new Date(savedDraft!.savedAt).toLocaleString()}</span>
          </div>
          <button
            type="button"
            onClick={discardDraft}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
          >
            <Trash2 size={13} />
            Discard draft
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Compose ── */}
        <div className="lg:col-span-3 space-y-5">
          <Card>
            <CardHeader>Compose</CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Email subject</label>
                  <Input
                    value={subject}
                    onChange={e => { setSubject(e.target.value) }}
                    placeholder="e.g. Important update from Acme"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Message headline</label>
                  <Input
                    value={title}
                    onChange={e => { setTitle(e.target.value) }}
                    placeholder="e.g. We just launched dark mode"
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">Used as the <code className="bg-[var(--color-surface-2)] px-1 rounded">{'{{title}}'}</code> in the email heading and subject suffix.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Message body</label>
                  <Textarea
                    value={message}
                    onChange={e => { setMessage(e.target.value) }}
                    rows={8}
                    placeholder="Write your message here. HTML is supported — e.g. <p>We worked hard on this feature...</p>"
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">Injected as <code className="bg-[var(--color-surface-2)] px-1 rounded">{'{{message}}'}</code> in the template. HTML is rendered as-is.</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Variable values reference */}
          <Card>
            <CardHeader>Variable values for this broadcast</CardHeader>
            <CardBody>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="pb-2 text-left font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Variable</th>
                    <th className="pb-2 text-left font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Will be replaced with</th>
                  </tr>
                </thead>
                <tbody>
                  {varValues(null).map(v => (
                    <tr key={v.name} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2 font-mono text-[var(--color-primary)]">{`{{${v.name}}}`}</td>
                      <td className="py-2 text-[var(--color-text)]">{v.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>

        {/* ── Audience + Actions ── */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader>Audience filter</CardHeader>
            <CardBody>
              <div className="space-y-4">
                <RoleFilter selected={filterRoles} onChange={setFilterRoles} />

                <div className="pt-2 border-t border-[var(--color-border)]">
                  {previewLoading ? (
                    <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
                  ) : (
                    <div className="flex items-center gap-2 mb-3">
                      <Users size={15} className="text-[var(--color-primary)]" />
                      <span className="text-sm font-semibold text-[var(--color-text)]">{recipientCount} recipient{recipientCount !== 1 ? 's' : ''}</span>
                      {recipientCount > 5 && <span className="text-xs text-[var(--color-text-muted)]">(5 shown)</span>}
                    </div>
                  )}
                  {(preview?.sample ?? []).length > 0 && (
                    <div className="space-y-0.5">
                      <p className="text-xs text-[var(--color-text-muted)] mb-1">Click a user to preview their email:</p>
                      {preview!.sample.map(u => (
                        <SampleUserRow key={u.id} user={u} onPreview={setPreviewUser} />
                      ))}
                    </div>
                  )}
                  {filterRoles.length > 0 && !previewLoading && (preview?.sample ?? []).length === 0 && (
                    <p className="text-sm text-[var(--color-text-muted)]">No users match this filter.</p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Send button */}
          <Card>
            <CardBody>
              <div className="space-y-3">
                <p className="text-sm text-[var(--color-text-muted)]">
                  {canSend
                    ? `Ready to send to ${recipientCount} user${recipientCount !== 1 ? 's' : ''}.`
                    : 'Fill in subject, headline, and message before sending.'}
                </p>
                <Button
                  className="w-full"
                  disabled={!canSend}
                  onClick={() => { setConfirmOpen(true) }}
                >
                  <Send size={15} />
                  Send to {recipientCount} user{recipientCount !== 1 ? 's' : ''}
                </Button>
                {!subject && <p className="text-xs text-[var(--color-text-muted)]">Missing: subject</p>}
                {!title && <p className="text-xs text-[var(--color-text-muted)]">Missing: headline</p>}
                {!message && <p className="text-xs text-[var(--color-text-muted)]">Missing: message</p>}
              </div>
            </CardBody>
          </Card>

          {/* Discard draft (standalone) */}
          {(subject || title || message) && (
            <button
              type="button"
              onClick={discardDraft}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
            >
              <Trash2 size={14} />
              Discard draft
            </button>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {previewUser && tpl?.body_html && (
        <Modal
          open={Boolean(previewUser)}
          onClose={() => { setPreviewUser(null) }}
          title={`Preview — ${previewUser.name ?? previewUser.email}`}
        >
          <div className="space-y-3">
            <div className="text-xs text-[var(--color-text-muted)] space-y-1">
              <p><span className="font-medium">To:</span> {previewUser.email}</p>
              <p><span className="font-medium">Subject:</span> {subject || '(no subject)'}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Variable values for this user</p>
              <table className="w-full text-xs">
                <tbody>
                  {varValues(previewUser).map(v => (
                    <tr key={v.name} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-1.5 font-mono text-[var(--color-primary)] pr-4">{`{{${v.name}}}`}</td>
                      <td className="py-1.5 text-[var(--color-text)]">{v.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ height: 360 }}>
              <iframe
                srcDoc={renderForUser(tpl.body_html, previewUser, title, message)}
                className="w-full h-full"
                sandbox="allow-same-origin"
                title="Email preview"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Send confirmation modal */}
      <Modal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false) }}
        title="Confirm broadcast"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setConfirmOpen(false) }}>Cancel</Button>
            <Button loading={sending} onClick={() => { void send() }}>
              <Send size={14} />
              Send to {recipientCount} users
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-[var(--color-text)]">
            You are about to send <strong>"{subject}"</strong> to <strong>{recipientCount} user{recipientCount !== 1 ? 's' : ''}</strong>. This cannot be undone.
          </p>
          <div className="p-3 rounded-lg bg-[var(--color-surface-2)] space-y-1 text-xs">
            <p><span className="text-[var(--color-text-muted)]">Subject:</span> <span className="font-medium">{subject}</span></p>
            <p><span className="text-[var(--color-text-muted)]">Headline:</span> <span className="font-medium">{title}</span></p>
            <p><span className="text-[var(--color-text-muted)]">Roles:</span> {filterRoles.length === ALL_ROLES.length ? 'All users' : filterRoles.join(', ')}</p>
          </div>
        </div>
      </Modal>

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}
