import { useState } from 'react'
import { config } from '../config'
import { analytics } from '../lib/analytics'

// Only renders if: analytics enabled AND no consent stored.
// On "Got it": stores consent and initializes analytics.
export function CookieBanner() {
  const [dismissed, setDismissed] = useState(
    () => Boolean(localStorage.getItem('cookie_consent')),
  )

  if (config.analytics === 'none') return null
  if (dismissed) return null

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true')
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
