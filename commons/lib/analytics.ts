// Analytics wrapper — PostHog inside. Never import posthog-js directly in app code.
// Only initializes if analytics !== 'none' AND cookie_consent is set.
import { config } from '../config'

type EventProperties = Record<string, string | number | boolean | null | undefined>

let posthog: typeof import('posthog-js').default | null = null

export const analytics = {
  initialize(): void {
    if (config.analytics !== 'posthog') return
    if (!import.meta.env['VITE_POSTHOG_KEY']) return
    import('posthog-js').then(({ default: ph }) => {
      ph.init(import.meta.env['VITE_POSTHOG_KEY'] as string, {
        api_host: import.meta.env['VITE_POSTHOG_HOST'] as string | undefined ?? 'https://app.posthog.com',
        session_recording: { maskAllInputs: true },
        loaded: (p) => { posthog = p },
      })
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
