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
      <h1 className="text-2xl font-bold">System</h1>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Deployment history</h2>
          <TestPushButton onNotify={notify} />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-text-muted)]">
              <th className="pb-2">SHA</th>
              <th className="pb-2">Branch</th>
              <th className="pb-2">Env</th>
              <th className="pb-2">Deployed</th>
            </tr>
          </thead>
          <tbody>
            {(deployments?.data ?? []).map(d => (
              <tr key={d.id} className="border-t border-[var(--color-border)]">
                <td className="py-2 font-mono text-xs">{d.sha}</td>
                <td className="py-2">{d.branch}</td>
                <td className="py-2">{d.env}</td>
                <td className="py-2">{new Date(d.deployed_at).toLocaleString()}</td>
              </tr>
            ))}
            {!deployments?.data?.length && (
              <tr><td colSpan={4} className="py-4 text-center text-[var(--color-text-muted)]">No deployments yet.</td></tr>
            )}
          </tbody>
        </table>
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
        className="px-2 py-1.5 text-sm rounded border border-[var(--color-border)] focus:outline-none w-48" />
      <Button size="sm" variant="secondary" loading={loading} onClick={() => { void send() }}>
        Test push
      </Button>
    </div>
  )
}
