import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth, Button, useNotification, NotificationContainer, Input, Card, PageHeader, Modal, fetchApi, config } from '@any-project-base/commons'
import { supabase } from '@any-project-base/commons/lib/supabase'
import { t, msg } from '@any-project-base/commons/i18n'
import type { NotificationSettings } from '@any-project-base/commons'

const DEFAULT_NOTIF: NotificationSettings = {
  email: { support_reply: true, credit_depletion: true, payment_failed: true },
  push:  { support_reply: true },
}

export function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { notifications, notify, dismiss } = useNotification()
  const [name, setName] = useState(user?.name ?? '')
  const [loading, setLoading] = useState(false)
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(
    user?.settings?.notification_settings ?? DEFAULT_NOTIF,
  )

  // Re-sync when user loads (auth is async)
  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setNotifSettings(user.settings?.notification_settings ?? DEFAULT_NOTIF)
    }
  }, [user])

  const save = async () => {
    setLoading(true)
    try {
      const trimmedName = name.trim()
      if (trimmedName !== (user?.name ?? '')) {
        await fetchApi(`${config.apiUrl}/users/me`, {
          method: 'PATCH',
          body: JSON.stringify({ name: trimmedName }),
        })
      }
      await fetchApi(`${config.apiUrl}/users/me/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ notification_settings: notifSettings }),
      })
      notify({ type: 'success', message: t(msg.Common.saved) })
    } catch {
      notify({ type: 'error', message: t(msg.Common.error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title={t(msg.Profile.title)} />

      <Card className="p-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium mb-1">{t(msg.Profile.name)}</label>
          <Input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value) }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t(msg.Profile.email)}</label>
          <Input type="email" value={user?.email ?? ''} disabled />
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Email notifications</p>
          {([
            ['support_reply',    'Support replies'],
            ['credit_depletion', 'Credit depletion warnings'],
            ['payment_failed',   'Payment failures'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifSettings.email[key]}
                onChange={e => {
                  setNotifSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, [key]: e.target.checked },
                  }))
                }}
                className="accent-[var(--color-primary)]"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        <Button onClick={() => { void save() }} loading={loading}>
          {t(msg.Common.save)}
        </Button>
      </Card>

      <DeleteAccountSection userEmail={user?.email ?? ''} onDeleted={() => { void navigate('/login') }} onError={() => { notify({ type: 'error', message: t(msg.Common.error) }) }} />

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}

function DeleteAccountSection({ userEmail, onDeleted, onError }: {
  userEmail: string
  onDeleted: () => void
  onError: () => void
}) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const doDelete = async () => {
    setLoading(true)
    try {
      await fetchApi(`${config.apiUrl}/users/me`, { method: 'DELETE' })
      await supabase.auth.signOut()
      onDeleted()
    } catch {
      onError()
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
        <p className="text-sm font-medium text-[var(--color-text)] mb-1">Delete account</p>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          Permanently deletes your account and all associated data. This cannot be undone.
        </p>
        <Button variant="danger" size="sm" onClick={() => { setOpen(true) }}>
          Delete my account
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setConfirm('') }}
        title="Delete account"
        footer={
          <Button
            variant="danger"
            disabled={confirm !== userEmail}
            loading={loading}
            onClick={() => { void doDelete() }}
          >
            Permanently delete
          </Button>
        }
      >
        <p className="text-sm mb-4">
          Type <strong>{userEmail}</strong> to confirm. All your data will be permanently deleted.
        </p>
        <Input
          type="email"
          value={confirm}
          onChange={e => { setConfirm(e.target.value) }}
          placeholder={userEmail}
        />
      </Modal>
    </>
  )
}
