import { Button } from '@any-project-base/commons'
import { Card, CardBody, PageHeader } from '@any-project-base/commons'
import { config } from '@any-project-base/commons'
import { t, msg } from '@any-project-base/commons/i18n'

// Hidden entirely if pricing_model: none — controlled by AppLayout nav + this guard.
export function BillingPage() {
  if (config.pricingModel === 'none') return null

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t(msg.Billing.title)} />
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
    <Card>
      <CardBody>
        <h2 className="font-semibold mb-4">Credits</h2>
        <p className="text-3xl font-bold text-[var(--color-primary)]">—</p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">credits remaining</p>
        {(config.pricingModel === 'credits' || config.pricingModel === 'subscription_credits') && (
          <Button className="mt-4">Buy credits</Button>
        )}
      </CardBody>
    </Card>
  )
}

function PlanDetails() {
  return (
    <Card>
      <CardBody>
        <h2 className="font-semibold mb-4">Your plan</h2>
        <p className="text-[var(--color-text-muted)] text-sm">Plan details load here.</p>
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
