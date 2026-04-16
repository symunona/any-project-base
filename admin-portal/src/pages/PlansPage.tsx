import { config } from '@any-project-base/commons'

// Hidden if pricing_model: none
export function PlansPage() {
  if (config.pricingModel === 'none') return null

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Plans</h1>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
        <p className="text-sm text-[var(--color-text-muted)]">
          Pricing model: <strong>{config.pricingModel}</strong>.
          Configure products via Stripe CLI: <code>just setup-step pricing</code>
        </p>
      </div>
    </div>
  )
}
