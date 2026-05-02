import { Component, useState } from 'react'
import type { ReactNode } from 'react'
import { config } from '../config'
import { analytics } from '../lib/analytics'

function safeLocalGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeLocalSet(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* blocked */ }
}

// Catches any render crash (e.g. uBlock Origin injecting JS that throws) — renders nothing.
class CookieBannerBoundary extends Component<{ children: ReactNode }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

// Only renders if: analytics enabled AND no consent stored.
// On "Got it": stores consent and initializes analytics.
function CookieBannerInner() {
  const [dismissed, setDismissed] = useState(
    () => Boolean(safeLocalGet('cookie_consent')),
  )

  if (config.analytics === 'none') return null
  if (dismissed) return null

  const handleAccept = () => {
    safeLocalSet('cookie_consent', 'true')
    analytics.initialize()
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)]
                    border-t border-[var(--color-border)] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 text-sm">
        <span className="text-[var(--color-text-muted)]">
          We use cookies for analytics.
        </span>
        <button
          onClick={handleAccept}
          className="shrink-0 px-4 py-1.5 rounded-md bg-[var(--color-primary)] text-white
                     text-sm font-medium hover:opacity-90"
        >
          Got it
        </button>
      </div>
    </div>
  )
}

export function CookieBanner() {
  return (
    <CookieBannerBoundary>
      <CookieBannerInner />
    </CookieBannerBoundary>
  )
}
