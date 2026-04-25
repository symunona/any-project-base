import { password, text, note, isCancel, log } from '@clack/prompts'
import { readYaml } from '../lib/yaml'
import { setEnv } from '../lib/env'
import { writeState, type StepResult } from '../lib/state'

export async function run(): Promise<StepResult> {
  const pricing = readYaml('pricing_model')
  if (!pricing || pricing === 'none') {
    log.info("pricing_model is 'none' — Stripe not needed. Set pricing_model in project.yaml to enable.")
    writeState('stripe', 'skipped', 'pricing_model=none')
    return { status: 'skipped', note: 'pricing_model=none' }
  }

  note('Stripe Dashboard → Developers → API keys\nhttps://dashboard.stripe.com', 'Stripe setup')

  const secret = await password({ message: 'Stripe Secret key (sk_test_… or sk_live_…)' })
  if (isCancel(secret)) { writeState('stripe', 'skipped'); return { status: 'skipped' } }

  if (!/^sk_(test|live)_/.test(String(secret))) {
    log.error('Key must start with sk_test_ or sk_live_')
    writeState('stripe', 'fail', 'invalid key format')
    return { status: 'fail', note: 'invalid key format' }
  }

  log.step('Validating with Stripe API...')
  const res = await fetch('https://api.stripe.com/v1/account', {
    headers: { Authorization: `Basic ${Buffer.from(String(secret) + ':').toString('base64')}` },
  })
  if (!res.ok) {
    log.error('Stripe rejected the key')
    writeState('stripe', 'fail', 'API rejected key')
    return { status: 'fail', note: 'API rejected key' }
  }

  const pub = await text({ message: 'Stripe Publishable key (pk_…)' })
  if (isCancel(pub)) { writeState('stripe', 'skipped'); return { status: 'skipped' } }

  note('Stripe Dashboard → Developers → Webhooks → Add endpoint\nEvents: customer.subscription.*, invoice.*, payment_intent.*\nFor local dev: run `just db-stripe-listen` to get the secret automatically.', 'Webhook')

  const webhook = await text({ message: 'Webhook Signing Secret (whsec_…) — press Enter to skip for now' })
  if (isCancel(webhook)) { writeState('stripe', 'skipped'); return { status: 'skipped' } }

  setEnv('STRIPE_SECRET_KEY', String(secret))
  setEnv('STRIPE_PUBLISHABLE_KEY', String(pub))
  setEnv('VITE_STRIPE_PUBLISHABLE_KEY', String(pub))
  if (webhook) setEnv('STRIPE_WEBHOOK_SECRET', String(webhook))

  writeState('stripe', 'ok')
  return { status: 'ok' }
}
