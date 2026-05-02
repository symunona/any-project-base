import { config, MODEL_PRICING, CREDIT_PACKS, CREDITS_PER_USD, CREDIT_MARKUP } from '@any-project-base/commons'

// Hidden if pricing_model: none
export function PlansPage() {
  if (config.pricingModel === 'none') return null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Plans</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Pricing model: <strong>{config.pricingModel}</strong>
        </p>
      </div>

      {(config.pricingModel === 'credits' || config.pricingModel === 'subscription_credits') && (
        <CreditPacksTable />
      )}
      <ApiPricingTable />
    </div>
  )
}

function CreditPacksTable() {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Credit packs</h2>
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-2)]">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-[var(--color-text-muted)]">Pack</th>
              <th className="px-5 py-3 text-right font-semibold text-[var(--color-text-muted)]">Price</th>
              <th className="px-5 py-3 text-right font-semibold text-[var(--color-text-muted)]">¢ / credit</th>
            </tr>
          </thead>
          <tbody>
            {CREDIT_PACKS.map(p => (
              <tr key={p.credits} className="border-t border-[var(--color-border)]">
                <td className="px-5 py-3 text-[var(--color-text)] font-medium">{p.label}</td>
                <td className="px-5 py-3 text-right text-[var(--color-text)]">{p.priceLabel}</td>
                <td className="px-5 py-3 text-right text-[var(--color-text-muted)]">
                  {(p.priceUsd / p.credits * 100).toFixed(1)}¢
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ApiPricingTable() {
  const entries = Object.entries(MODEL_PRICING)
  return (
    <section>
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">Claude API pricing</h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-3">
        Credits charged = cost × {CREDITS_PER_USD} credits/$ × {CREDIT_MARKUP}× markup.
        Manage API keys at{' '}
        <code className="text-xs bg-[var(--color-border)] px-1.5 py-0.5 rounded">just setup-step pricing</code>.
      </p>
      <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-2)]">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-[var(--color-text-muted)]">Model</th>
              <th className="px-5 py-3 text-right font-semibold text-[var(--color-text-muted)]">Input / MTok</th>
              <th className="px-5 py-3 text-right font-semibold text-[var(--color-text-muted)]">Output / MTok</th>
              <th className="px-5 py-3 text-right font-semibold text-[var(--color-text-muted)]">Cache write</th>
              <th className="px-5 py-3 text-right font-semibold text-[var(--color-text-muted)]">Cache read</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([model, p]) => (
              <tr key={model} className="border-t border-[var(--color-border)]">
                <td className="px-5 py-3 font-mono text-xs text-[var(--color-text)]">{model}</td>
                <td className="px-5 py-3 text-right text-[var(--color-text-muted)]">${p.inputPerMtok.toFixed(2)}</td>
                <td className="px-5 py-3 text-right text-[var(--color-text-muted)]">${p.outputPerMtok.toFixed(2)}</td>
                <td className="px-5 py-3 text-right text-[var(--color-text-muted)]">
                  {p.cacheWritePerMtok != null ? `$${p.cacheWritePerMtok.toFixed(2)}` : '—'}
                </td>
                <td className="px-5 py-3 text-right text-[var(--color-text-muted)]">
                  {p.cacheReadPerMtok != null ? `$${p.cacheReadPerMtok.toFixed(2)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
