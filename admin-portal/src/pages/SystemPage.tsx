import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchApi, Button, useNotification, NotificationContainer, Card, CardHeader, CardBody, PageHeader, Input } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import type { Deployment } from '@any-project-base/commons'

export function SystemPage() {
  const { notifications, notify, dismiss } = useNotification()

  const { data: deployments } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => fetchApi<{ data: Deployment[] }>(`${config.apiUrl}/deployments?limit=20&offset=0`),
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="System" subtitle="Monitor deployments and system health" />

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
