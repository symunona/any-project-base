import { useState, useCallback } from 'react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export type Notification = {
  id: string
  type: NotificationType
  message: string
}

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const notify = useCallback((n: Omit<Notification, 'id'>, durationMs = 4000) => {
    const id = Math.random().toString(36).slice(2)
    setNotifications(prev => [...prev, { ...n, id }])
    if (durationMs > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(x => x.id !== id))
      }, durationMs)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(x => x.id !== id))
  }, [])

  return { notifications, notify, dismiss }
}
