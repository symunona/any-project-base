import { useState } from 'react'
import { useAuth, Button, useNotification, NotificationContainer, Input, Card, PageHeader } from '@any-project-base/commons'
import { fetchApi } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import { t, msg } from '@any-project-base/commons/i18n'

export function ProfilePage() {
  const { user } = useAuth()
  const { notifications, notify, dismiss } = useNotification()
  const [name, setName] = useState(user?.name ?? '')
  const [loading, setLoading] = useState(false)

  const [notifSettings, setNotifSettings] = useState(
    user?.settings.notification_settings ?? {
      email: { support_reply: true, credit_depletion: true, payment_failed: true },
      push: { support_reply: true },
    },
  )

  const save = async () => {
    setLoading(true)
    try {
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
            ['support_reply', 'Support replies'],
            ['credit_depletion', 'Credit depletion warnings'],
            ['payment_failed', 'Payment failures'],
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

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}
