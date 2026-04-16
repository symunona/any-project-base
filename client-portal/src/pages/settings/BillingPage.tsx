import { config } from '@any-project-base/commons'
import { t, msg } from '@any-project-base/commons/i18n'

// Hidden entirely if pricing_model: none — controlled by AppLayout nav + this guard.
export function BillingPage() {
  if (config.pricingModel === 'none') return null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t(msg.Billing.title)}</h1>
      <div className="grid gap-6">
        <CreditBalance />
        <PlanDetails />
        <TransactionHistory />
      </div>
    </div>
  )
}

function CreditBalance() {
  if (config.pricingModel === 'tiers') return null
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
      <h2 className="font-semibold mb-4">Credits</h2>
      <p className="text-3xl font-bold text-[var(--color-primary)]">—</p>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">credits remaining</p>
      {(config.pricingModel === 'credits' || config.pricingModel === 'subscription_credits') && (
        <button className="mt-4 px-4 py-2 rounded-md bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90">
          Buy credits
        </button>
      )}
    </div>
  )
}

function PlanDetails() {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
      <h2 className="font-semibold mb-4">Your plan</h2>
      <p className="text-[var(--color-text-muted)] text-sm">Plan details load here.</p>
    </div>
  )
}

function TransactionHistory() {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
      <h2 className="font-semibold mb-4">Transaction history</h2>
      <p className="text-[var(--color-text-muted)] text-sm">No transactions yet.</p>
    </div>
  )
}
