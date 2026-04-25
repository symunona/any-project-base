// Error monitoring wrapper — Sentry inside. Never import @sentry/react directly in app code.
import { config } from '../config'

type ErrorContext = Record<string, string | number | boolean | null | undefined>

let sentry: typeof import('@sentry/react') | null = null

if ((config as { error_monitoring?: string }).error_monitoring === 'sentry' &&
    import.meta.env['VITE_SENTRY_DSN']) {
  import('@sentry/react').then((s) => {
    s.init({ dsn: import.meta.env['VITE_SENTRY_DSN'] as string })
    sentry = s
  }).catch(() => {/* Sentry not installed */})
}

export const errorMonitor = {
  capture(error: unknown, context?: ErrorContext): void {
    if (sentry) {
      sentry.captureException(error, context ? { extra: context } : undefined)
    } else {
      console.error('[errorMonitor]', error, context)
    }
  },

  setUser(id: string, email?: string): void {
    sentry?.setUser(email !== undefined ? { id, email } : { id })
  },

  addBreadcrumb(message: string, data?: ErrorContext): void {
    sentry?.addBreadcrumb(data !== undefined ? { message, data } : { message })
  },
}
