import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApi, Button, Badge, useNotification, NotificationContainer, Card, CardHeader, CardBody, PageHeader, Input, useSystemSettings } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import type { Deployment, SystemSettings, EmailTemplate } from '@any-project-base/commons'
import { CheckCircle2, Terminal } from 'lucide-react'

type Tab = 'settings' | 'deployments' | 'templates'

export function SystemPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as Tab) ?? 'settings'
  const setTab = (t: Tab) => { setSearchParams({ tab: t }) }

  const { notifications, notify, dismiss } = useNotification()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="System" subtitle="Settings, deployments, and email templates" />

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--color-border)]">
        {([
          ['settings',    'Settings'],
          ['deployments', 'Deployments'],
          ['templates',   'Email Templates'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key) }}
            className={[
              'px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === key
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'settings'    && <SettingsTab onNotify={notify} />}
      {activeTab === 'deployments' && <DeploymentsTab onNotify={notify} />}
      {activeTab === 'templates'   && <TemplatesTab />}

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}

// ─── Settings tab ─────────────────────────────────────────────────────────

function SettingsTab({ onNotify }: { onNotify: (n: { type: 'success' | 'error'; message: string }) => void }) {
  const qc = useQueryClient()
  const { data: systemSettings, isLoading } = useSystemSettings()

  const toggle = async (field: keyof SystemSettings) => {
    if (!systemSettings) return
    try {
      await fetchApi(`${config.apiUrl}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: !systemSettings[field] }),
      })
      await qc.invalidateQueries({ queryKey: ['system-settings'] })
      onNotify({ type: 'success', message: 'Setting saved.' })
    } catch {
      onNotify({ type: 'error', message: 'Failed to save setting.' })
    }
  }

  return (
    <Card>
      <CardHeader>Settings</CardHeader>
      <CardBody>
        {isLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : (
          <div className="space-y-4">
            <ToggleRow label="Registration open" description="Allow new users to create accounts" value={systemSettings?.registration_open ?? true} onToggle={() => { void toggle('registration_open') }} />
            <ToggleRow label="Invite only" description="Show invite-only message on login page instead of register link" value={systemSettings?.invite_only ?? false} onToggle={() => { void toggle('invite_only') }} />
            <ToggleRow label="Maintenance mode" description="Show maintenance banner on client portal" value={systemSettings?.maintenance_mode ?? false} onToggle={() => { void toggle('maintenance_mode') }} />
            <ToggleRow label="Onboarding video" description="Show product intro video modal to new users on first login" value={systemSettings?.onboarding_enabled ?? true} onToggle={() => { void toggle('onboarding_enabled') }} />
          </div>
        )}
      </CardBody>
    </Card>
  )
}

// ─── Deployments tab ──────────────────────────────────────────────────────

function DeploymentsTab({ onNotify }: { onNotify: (n: { type: 'success' | 'error'; message: string }) => void }) {
  const { data: deployments } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => fetchApi<{ data: Deployment[] }>(`${config.apiUrl}/deployments?limit=20&offset=0`),
  })

  return (
    <Card>
      <CardHeader actions={<TestPushButton onNotify={onNotify} />}>Deployment history</CardHeader>
      <CardBody>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">SHA</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Branch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Env</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Deployed</th>
            </tr>
          </thead>
          <tbody>
            {(deployments?.data ?? []).map(d => (
              <tr key={d.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-[var(--color-text)]">{d.sha}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-text)]">{d.branch}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-text)]">{d.env}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-text)]">{new Date(d.deployed_at).toLocaleString()}</td>
              </tr>
            ))}
            {!deployments?.data?.length && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-[var(--color-text-muted)]">No deployments yet.</td></tr>
            )}
          </tbody>
        </table>
      </CardBody>
    </Card>
  )
}

// ─── Email Templates tab ──────────────────────────────────────────────────

const TEMPLATE_DISPLAY_NAMES: Record<string, string> = {
  welcome:            'Welcome',
  password_reset:     'Password Reset (app)',
  support_reply:      'Support Reply',
  credit_depletion:   'Credit Depletion',
  payment_failed:     'Payment Failed',
  magic_link:         'Magic Link (app)',
  system_update:      'System Update / Broadcast',
  auth_invite:        'Invite',
  auth_recovery:      'Password Reset',
  auth_magic_link:    'Magic Link',
  auth_confirmation:  'Email Confirmation',
  auth_email_change:  'Email Change',
}

function TemplatesTab() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery<{ data: EmailTemplate[] }>({
    queryKey: ['email-templates'],
    queryFn: () => fetchApi<{ data: EmailTemplate[] }>(`${config.apiUrl}/email-templates`),
  })

  const appTemplates  = (data?.data ?? []).filter(t => t.type === 'app')
  const authTemplates = (data?.data ?? []).filter(t => t.type === 'auth')

  if (isLoading) return <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>

  return (
    <div className="space-y-6">
      {/* Auth templates */}
      <Card>
        <CardHeader>
          <span className="flex items-center gap-2">
            <Terminal size={15} />
            Auth templates
            <span className="text-xs font-normal text-[var(--color-text-muted)]">— sent by Supabase, require redeploy after changes</span>
          </span>
        </CardHeader>
        <CardBody>
          <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            These templates are controlled by Supabase's auth system (invite, password reset, magic link, etc.). Edit them here for branding, then run <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">just sync-auth-templates</code> to export changes to <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">supabase/templates/</code>.
          </div>
          <TemplateTable templates={authTemplates} onEdit={id => { void navigate(`/system/templates/${id}`) }} />
        </CardBody>
      </Card>

      {/* App templates */}
      <Card>
        <CardHeader>
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            App templates
            <span className="text-xs font-normal text-[var(--color-text-muted)]">— sent by your send-email function, live immediately</span>
          </span>
        </CardHeader>
        <CardBody>
          <TemplateTable templates={appTemplates} onEdit={id => { void navigate(`/system/templates/${id}`) }} />
        </CardBody>
      </Card>
    </div>
  )
}

function TemplateTable({ templates, onEdit }: { templates: EmailTemplate[]; onEdit: (id: string) => void }) {
  if (!templates.length) return <p className="text-sm text-[var(--color-text-muted)]">No templates.</p>
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--color-border)]">
          <th className="pb-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Template</th>
          <th className="pb-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide hidden sm:table-cell">Subject</th>
          <th className="pb-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Status</th>
          <th className="pb-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide hidden md:table-cell">Updated</th>
          <th className="pb-3" />
        </tr>
      </thead>
      <tbody>
        {templates.map(t => (
          <tr
            key={t.id}
            onClick={() => { onEdit(t.id) }}
            className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors"
          >
            <td className="py-3 pr-4 font-medium text-[var(--color-text)]">{TEMPLATE_DISPLAY_NAMES[t.id] ?? t.id}</td>
            <td className="py-3 pr-4 text-[var(--color-text-muted)] hidden sm:table-cell max-w-xs truncate">{t.subject}</td>
            <td className="py-3 pr-4">
              <Badge variant={t.enabled ? 'success' : 'neutral'}>{t.enabled ? 'Enabled' : 'Disabled'}</Badge>
            </td>
            <td className="py-3 pr-4 text-[var(--color-text-muted)] text-xs hidden md:table-cell">
              {new Date(t.updated_at).toLocaleDateString()}
            </td>
            <td className="py-3 text-right">
              <span className="text-xs text-[var(--color-primary)]">Edit →</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────

function ToggleRow({ label, description, value, onToggle }: { label: string; description: string; value: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors
          ${value ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
        role="switch" aria-checked={value}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function TestPushButton({ onNotify }: { onNotify: (n: { type: 'success' | 'error'; message: string }) => void }) {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const send = async () => {
    if (!userId) return
    setLoading(true)
    try {
      await fetchApi(`${config.apiUrl}/push/test`, { method: 'POST', body: JSON.stringify({ user_id: userId, title: 'Test push', body: 'Push notifications working!' }) })
      onNotify({ type: 'success', message: 'Test push sent.' })
    } catch {
      onNotify({ type: 'error', message: 'Push failed — check FCM config.' })
    } finally { setLoading(false) }
  }
  return (
    <div className="flex gap-2 items-center">
      <Input value={userId} onChange={e => { setUserId(e.target.value) }} placeholder="User ID" className="w-48" />
      <Button size="sm" variant="secondary" loading={loading} onClick={() => { void send() }}>Test push</Button>
    </div>
  )
}
