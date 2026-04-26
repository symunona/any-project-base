import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCredits, PageHeader, Card, CardBody, Button, useNotification, NotificationContainer } from '@any-project-base/commons'

const PACKAGES = [
  { credits: 100,  label: '100 credits',  price: '$5' },
  { credits: 500,  label: '500 credits',  price: '$20' },
  { credits: 1000, label: '1,000 credits', price: '$40' },
  { credits: 5000, label: '5,000 credits', price: '$150' },
]

export function BuyCreditsPage() {
  const navigate = useNavigate()
  const { balance, purchase } = useCredits()
  const { notifications, notify, dismiss } = useNotification()
  const [loading, setLoading] = useState<number | null>(null)
  const [custom, setCustom] = useState('')

  const buy = async (credits: number) => {
    setLoading(credits)
    try {
      const result = await purchase(credits)
      notify({ type: 'success', message: `${credits.toLocaleString()} credits added. New balance: ${result.balance.toLocaleString()}` })
    } catch {
      notify({ type: 'error', message: 'Purchase failed.' })
    } finally {
      setLoading(null)
    }
  }

  const customCredits = parseInt(custom, 10)

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Buy Credits" subtitle={`Current balance: ${balance.toLocaleString()} credits`} />

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PACKAGES.map(pkg => (
              <div
                key={pkg.credits}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--color-surface-2)]"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{pkg.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{pkg.price}</p>
                </div>
                <Button
                  size="sm"
                  loading={loading === pkg.credits}
                  disabled={loading !== null}
                  onClick={() => { void buy(pkg.credits) }}
                >
                  Buy
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Custom amount</p>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                min={1}
                placeholder="Enter credits"
                value={custom}
                onChange={e => { setCustom(e.target.value) }}
                className="w-40 px-4 py-2.5 rounded-xl text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
              />
              <Button
                size="sm"
                disabled={!customCredits || customCredits < 1 || loading !== null}
                loading={loading === customCredits}
                onClick={() => { void buy(customCredits) }}
              >
                Buy {customCredits > 0 ? customCredits.toLocaleString() : ''} credits
              </Button>
            </div>
          </div>

          <p className="mt-5 text-xs text-[var(--color-text-muted)]">
            ⚡ Stub mode — all purchases approved instantly, no payment required.
          </p>
        </CardBody>
      </Card>

      <div className="mt-4">
        <button
          onClick={() => { void navigate(-1) }}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          ← Back
        </button>
      </div>

      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}
