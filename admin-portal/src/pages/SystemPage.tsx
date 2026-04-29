import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApi, Button, useNotification, NotificationContainer, Card, CardHeader, CardBody, PageHeader, Input, useSystemSettings } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import type { Deployment, SystemSettings } from '@any-project-base/commons'

export function SystemPage() {
  const { notifications, notify, dismiss } = useNotification()
  const qc = useQueryClient()

  const { data: systemSettings, isLoading: settingsLoading } = useSystemSettings()

  const { data: deployments } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => fetchApi<{ data: Deployment[] }>(`${config.apiUrl}/deployments?limit=20&offset=0`),
  })

  const toggle = async (field: keyof SystemSettings) => {
    if (!systemSettings) return
    const updated = { [field]: !systemSettings[field] }
    try {
      await fetchApi(`${config.apiUrl}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(updated),
      })
      await qc.invalidateQueries({ queryKey: ['system-settings'] })
      notify({ type: 'success', message: 'Setting saved.' })
    } catch {
      notify({ type: 'error', message: 'Failed to save setting.' })
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="System" subtitle="Monitor deployments and system health" />

      <Card>
        <CardHeader>Settings</CardHeader>
        <CardBody>
          {settingsLoading ? (
            <p className="text-sm text-[var(--color-text-muted)] px-2">Loading…</p>
          ) : (
            <div className="space-y-4">
              <ToggleRow
                label="Registration open"
                description="Allow new users to create accounts"
                value={systemSettings?.registration_open ?? true}
                onToggle={() => { void toggle('registration_open') }}
              />
              <ToggleRow
                label="Invite only"
                description="Show invite-only message on login page instead of register link"
                value={systemSettings?.invite_only ?? false}
                onToggle={() => { void toggle('invite_only') }}
              />
              <ToggleRow
                label="Maintenance mode"
                description="Show maintenance banner on client portal"
                value={systemSettings?.maintenance_mode ?? false}
                onToggle={() => { void toggle('maintenance_mode') }}
              />
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader actions={<TestPushButton onNotify={notify} />}>Deployment history</CardHeader>
        <CardBody>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">SHA</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Env</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Deployed</th>
              </tr>
            </thead>
            <tbody>
              {(deployments?.data ?? []).map(d => (
                <tr key={d.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="px-6 py-3 text-sm text-[var(--color-text)] font-mono text-xs">{d.sha}</td>
                  <td className="px-6 py-3 text-sm text-[var(--color-text)]">{d.branch}</td>
                  <td className="px-6 py-3 text-sm text-[var(--color-text)]">{d.env}</td>
                  <td className="px-6 py-3 text-sm text-[var(--color-text)]">{new Date(d.deployed_at).toLocaleString()}</td>
                </tr>
              ))}
              {!deployments?.data?.length && (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-[var(--color-text-muted)]">No deployments yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}

function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string
  description: string
  value: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2
          ${value ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
            transform transition-transform duration-200
            ${value ? 'translate-x-5' : 'translate-x-0'}`}
        />
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
      await fetchApi(`${config.apiUrl}/push/test`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, title: 'Test push', body: 'Push notifications working!' }),
      })
      onNotify({ type: 'success', message: 'Test push sent.' })
    } catch {
      onNotify({ type: 'error', message: 'Push failed — check FCM config.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <Input value={userId} onChange={e => { setUserId(e.target.value) }}
        placeholder="User ID"
        className="w-48" />
      <Button size="sm" variant="secondary" loading={loading} onClick={() => { void send() }}>
        Test push
      </Button>
    </div>
  )
}
