import { X } from 'lucide-react'
import type { Notification, NotificationType } from '../hooks/useNotification'

type NotificationToastProps = {
  notification: Notification
  onDismiss: (id: string) => void
}

const typeClasses: Record<NotificationType, string> = {
  success: 'border-[var(--color-success)] bg-[var(--color-success-bg)]',
  error:   'border-[var(--color-danger)]  bg-[var(--color-danger-bg,#ef444411)]',
  warning: 'border-[var(--color-warning)] bg-[var(--color-warning-bg)]',
  info:    'border-[var(--color-accent)]  bg-[var(--color-accent-bg)]',
}

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  return (
    <div className={[
      'flex items-start gap-3 p-4 rounded-lg border shadow-md max-w-sm w-full',
      typeClasses[notification.type],
    ].join(' ')}>
      <span className="flex-1 text-sm">{notification.message}</span>
      <button
        onClick={() => { onDismiss(notification.id) }}
        className="shrink-0 opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}

type NotificationContainerProps = {
  notifications: Notification[]
  onDismiss: (id: string) => void
}

export function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
  if (notifications.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map(n => (
        <div key={n.id} className="pointer-events-auto">
          <NotificationToast notification={n} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
