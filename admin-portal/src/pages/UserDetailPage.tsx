import { useState } from 'react'
import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchApi, Badge, Button, Modal, useNotification, NotificationContainer } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import type { User } from '@any-project-base/commons'

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { notifications, notify, dismiss } = useNotification()

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['user', id],
    queryFn: () => fetchApi<User>(`${config.apiUrl}/users/${id}`),
    enabled: Boolean(id),
  })

  if (isLoading) return <div>Loading…</div>
  if (!user) return <div>User not found.</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{user.name ?? user.email}</h1>

      {/* Profile */}
      <Section title="Profile">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-[var(--color-text-muted)]">Email</dt><dd>{user.email}</dd>
          <dt className="text-[var(--color-text-muted)]">Role</dt>
          <dd><Badge variant={user.role === 'admin' ? 'danger' : user.role === 'support' ? 'warning' : 'neutral'}>{user.role}</Badge></dd>
          <dt className="text-[var(--color-text-muted)]">Joined</dt>
          <dd>{new Date(user.created_at).toLocaleString()}</dd>
        </dl>
      </Section>

      {/* Magic links */}
      <Section title="Login Links">
        <MagicLinkPanel userId={user.id} onNotify={notify} />
      </Section>

      {/* Devices */}
      <Section title="Devices">
        <DeviceList userId={user.id} />
      </Section>

      {/* Usage */}
      <Section title="Usage">
        <p className="text-sm text-[var(--color-text-muted)]">Usage stats load here. See /usage?user_id={user.id}</p>
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone">
        <DeleteUser user={user} onNotify={notify} />
      </Section>

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
      <h2 className="font-semibold mb-4">{title}</h2>
      {children}
    </div>
  )
}

function MagicLinkPanel({ userId, onNotify }: { userId: string; onNotify: (n: { type: 'success' | 'error'; message: string }) => void }) {
  const [generating, setGenerating] = useState(false)

  const generate = async () => {
    setGenerating(true)
    try {
      const { url } = await fetchApi<{ url: string }>(`${config.apiUrl}/magic-links`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      })
      await navigator.clipboard.writeText(url)
      onNotify({ type: 'success', message: 'Link copied to clipboard.' })
    } catch {
      onNotify({ type: 'error', message: 'Failed to generate link.' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button size="sm" onClick={() => { void generate() }} loading={generating}>
      Generate login link
    </Button>
  )
}

function DeviceList({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ['devices', userId],
    queryFn: () => fetchApi<{ data: Array<{ id: string; platform: string; last_seen: string; created_at: string }> }>(
      `${config.apiUrl}/users/${userId}/devices`,
    ),
  })
  if (!data?.data?.length) return <p className="text-sm text-[var(--color-text-muted)]">No devices registered.</p>
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-left text-[var(--color-text-muted)]">
        <th className="pb-2">Platform</th><th className="pb-2">Last seen</th><th className="pb-2">First seen</th>
      </tr></thead>
      <tbody>
        {data.data.map(d => (
          <tr key={d.id} className="border-t border-[var(--color-border)]">
            <td className="py-2 capitalize">{d.platform}</td>
            <td className="py-2">{new Date(d.last_seen).toLocaleString()}</td>
            <td className="py-2">{new Date(d.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DeleteUser({ user, onNotify }: { user: User; onNotify: (n: { type: 'success' | 'error'; message: string }) => void }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const doDelete = async () => {
    setLoading(true)
    try {
      await fetchApi(`${config.apiUrl}/users/${user.id}`, { method: 'DELETE' })
      onNotify({ type: 'success', message: 'User deleted.' })
      setOpen(false)
    } catch {
      onNotify({ type: 'error', message: 'Delete failed.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => { setOpen(true) }}>Delete user</Button>
      <Modal open={open} onClose={() => { setOpen(false); setConfirm('') }} title="Delete user"
        footer={
          <Button variant="danger" disabled={confirm !== (user.name ?? user.email)} loading={loading}
            onClick={() => { void doDelete() }}>
            Permanently delete
          </Button>
        }>
        <p className="text-sm mb-4">
          Type <strong>{user.name ?? user.email}</strong> to confirm deletion. This cannot be undone.
        </p>
        <input value={confirm} onChange={e => { setConfirm(e.target.value) }}
          className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger)]" />
      </Modal>
    </>
  )
}
