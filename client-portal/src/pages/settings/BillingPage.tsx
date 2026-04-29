import { useNavigate } from 'react-router'
import { useCredits, Button } from '@any-project-base/commons'
import { Card, CardBody, CardHeader, PageHeader } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import { CREDIT_PACKS, MODEL_PRICING } from '@any-project-base/commons'
import { t, msg } from '@any-project-base/commons/i18n'

// Hidden entirely if pricing_model: none — controlled by AppLayout nav + this guard.
export function BillingPage() {
  if (config.pricingModel === 'none') return null

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t(msg.Billing.title)} />
      <div className="grid gap-6">
        <CreditBalance />
        <CreditPacks />
        <ApiPricing />
        <TransactionHistory />
      </div>
    </div>
  )
}

function CreditBalance() {
  const navigate = useNavigate()
  const { balance, loading } = useCredits()
  if (config.pricingModel === 'tiers') return null
  return (
    <Card>
      <CardBody>
        <h2 className="font-semibold mb-4">Credits</h2>
        <p className="text-3xl font-bold text-[var(--color-primary)]">
          {loading ? '…' : balance.toLocaleString()}
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">credits remaining</p>
        {(config.pricingModel === 'credits' || config.pricingModel === 'subscription_credits') && (
          <Button className="mt-4" onClick={() => { void navigate('/buy-credits') }}>Buy credits</Button>
        )}
      </CardBody>
    </Card>
  )
}

function CreditPacks() {
  const navigate = useNavigate()
  if (config.pricingModel !== 'credits' && config.pricingModel !== 'subscription_credits') return null
  return (
    <Card>
      <CardHeader>Credit packs</CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-3">
          {CREDIT_PACKS.map(pack => (
            <div key={pack.credits} className="rounded-xl p-4 bg-[var(--color-surface-2)] flex flex-col gap-1">
              <p className="text-lg font-bold text-[var(--color-primary)]">{pack.priceLabel}</p>
              <p className="text-sm font-medium text-[var(--color-text)]">{pack.label}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {(pack.priceUsd / pack.credits * 100).toFixed(1)}¢ / credit
              </p>
            </div>
          ))}
        </div>
        <Button className="mt-4 w-full" variant="secondary" onClick={() => { void navigate('/buy-credits') }}>
          Buy credits →
        </Button>
      </CardBody>
    </Card>
  )
}

function ApiPricing() {
  const entries = Object.entries(MODEL_PRICING)
    .filter(([k]) => !k.includes('claude-3-'))  // show current models only
  return (
    <Card>
      <CardHeader>Claude API pricing</CardHeader>
      <CardBody>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Credits consumed per API call are calculated from actual token usage × 2× markup.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[var(--color-border)]">
                <th className="pb-2 font-semibold text-[var(--color-text-muted)]">Model</th>
                <th className="pb-2 font-semibold text-[var(--color-text-muted)] text-right">Input / MTok</th>
                <th className="pb-2 font-semibold text-[var(--color-text-muted)] text-right">Output / MTok</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([model, p]) => (
                <tr key={model} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="py-2.5 font-mono text-xs text-[var(--color-text)]">{model}</td>
                  <td className="py-2.5 text-right text-[var(--color-text-muted)]">${p.inputPerMtok.toFixed(2)}</td>
                  <td className="py-2.5 text-right text-[var(--color-text-muted)]">${p.outputPerMtok.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}

function TransactionHistory() {
  return (
    <Card>
      <CardBody>
        <h2 className="font-semibold mb-4">Transaction history</h2>
        <p className="text-[var(--color-text-muted)] text-sm">No transactions yet.</p>
      </CardBody>
    </Card>
  )
}
