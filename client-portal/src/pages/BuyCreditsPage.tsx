import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCredits, PageHeader, Card, CardBody, Button, useNotification, NotificationContainer, fetchApi, config } from '@any-project-base/commons'
import { CREDIT_PACKS } from '@any-project-base/commons'

export function BuyCreditsPage() {
  const navigate = useNavigate()
  const { balance } = useCredits()
  const { notifications, notify, dismiss } = useNotification()
  const [loading, setLoading] = useState<number | null>(null)
  const [custom, setCustom] = useState('')

  const checkout = async (credits: number) => {
    setLoading(credits)
    try {
      const origin = window.location.origin
      const { url } = await fetchApi<{ url: string }>(`${config.apiUrl}/users/me/credits/checkout`, {
        method: 'POST',
        body: JSON.stringify({
          credits,
          successUrl: `${origin}/buy-credits/success?credits=${credits}`,
          cancelUrl:  `${origin}/buy-credits/cancel`,
        }),
      })
      window.location.href = url
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout failed.'
      notify({ type: 'error', message: msg })
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
            {CREDIT_PACKS.map(pkg => (
              <div
                key={pkg.credits}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--color-surface-2)]"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{pkg.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{pkg.priceLabel}</p>
                </div>
                <Button
                  size="sm"
                  loading={loading === pkg.credits}
                  disabled={loading !== null}
                  onClick={() => { void checkout(pkg.credits) }}
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
                onClick={() => { void checkout(customCredits) }}
              >
                Buy {customCredits > 0 ? customCredits.toLocaleString() : ''} credits
              </Button>
            </div>
          </div>
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
