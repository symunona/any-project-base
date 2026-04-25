// Analytics wrapper — PostHog inside. Never import posthog-js directly in app code.
// Only initializes if analytics !== 'none' AND cookie_consent is set.
import { config } from '../config'

type EventProperties = Record<string, string | number | boolean | null | undefined>

type PostHog = {
  init(key: string, opts?: Record<string, unknown>): void
  capture(event: string, props?: Record<string, unknown>): void
  identify(id: string, props?: Record<string, unknown>): void
  reset(): void
}

let posthog: PostHog | null = null

export const analytics = {
  initialize(): void {
    if (config.analytics !== 'posthog') return
    if (!import.meta.env['VITE_POSTHOG_KEY']) return
    import('posthog-js').then(({ default: ph }) => {
      ph.init(import.meta.env['VITE_POSTHOG_KEY'] as string, {
        api_host: import.meta.env['VITE_POSTHOG_HOST'] as string ?? 'https://app.posthog.com',
        session_recording: { maskAllInputs: true },
      })
      posthog = ph
    }).catch(() => {/* PostHog not installed — analytics disabled */})
  },

  track(event: string, properties?: EventProperties): void {
    posthog?.capture(event, properties)
  },

  identify(userId: string, properties?: EventProperties): void {
    posthog?.identify(userId, properties)
  },

  page(): void {
    posthog?.capture('$pageview')
  },

  reset(): void {
    posthog?.reset()
  },
}
