import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchApi, Button, useNotification, NotificationContainer } from '@any-project-base/commons'
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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">System</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Monitor deployments and system health</p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text)]">Deployment history</h2>
          <div><TestPushButton onNotify={notify} /></div>
        </div>
        <div className="p-6">
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
        </div>
      </div>

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
      <input value={userId} onChange={e => { setUserId(e.target.value) }}
        placeholder="User ID"
        className="px-2 py-1.5 text-sm rounded rounded-xl focus:outline-none w-48" />
      <Button size="sm" variant="secondary" loading={loading} onClick={() => { void send() }}>
        Test push
      </Button>
    </div>
  )
}
