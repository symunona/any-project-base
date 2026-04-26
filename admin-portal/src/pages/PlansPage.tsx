import { config } from '@any-project-base/commons'

// Hidden if pricing_model: none
export function PlansPage() {
  if (config.pricingModel === 'none') return null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Plans</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage subscription plans and pricing</p>
      </div>
      <div className="bg-[var(--color-surface-2)] rounded-xl p-5 text-sm text-[var(--color-text-muted)]">
        <p>
          Pricing model: <strong>{config.pricingModel}</strong>.
          Configure products via Stripe CLI: <code className="font-mono text-xs bg-[var(--color-border)] px-1.5 py-0.5 rounded">just setup-step pricing</code>
        </p>
      </div>
    </div>
  )
}
