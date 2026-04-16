import { Hono } from 'https://deno.land/x/hono@v4.7.7/mod.ts'
import { getAdminClient } from '../_shared/db.ts'

const app = new Hono()

app.post('/', async (c) => {
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) return c.json({ error: 'Stripe not configured' }, 503)

  const body = await c.req.text()
  const signature = c.req.header('stripe-signature') ?? ''

  // Verify Stripe signature — reject if invalid
  // NOTE: Stripe SDK not available in Deno — use manual HMAC verification
  const isValid = await verifyStripeSignature(body, signature, webhookSecret)
  if (!isValid) return c.json({ error: 'Invalid signature' }, 400)

  const event = JSON.parse(body) as { type: string; id: string; data: { object: Record<string, unknown> } }
  const admin = getAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      await admin.from('stripe_transactions').insert({
        user_id: session['client_reference_id'],
        stripe_event_id: event.id,
        type: 'credit_purchase',
        amount_usd: (session['amount_total'] as number) / 100,
        credits_delta: session['metadata'] ? (session['metadata'] as Record<string, number>)['credits'] : 0,
      }).onConflict('stripe_event_id').ignore()
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await admin.from('stripe_subscriptions')
        .update({ status: sub['status'], updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub['id'])
      break
    }
    case 'invoice.paid': {
      const invoice = event.data.object
      await admin.from('stripe_transactions').insert({
        stripe_event_id: event.id,
        type: 'subscription_payment',
        amount_usd: (invoice['amount_paid'] as number) / 100,
      }).onConflict('stripe_event_id').ignore()
      break
    }
    case 'invoice.payment_failed': {
      // TODO: email user
      console.log('[stripe-webhook] Payment failed:', event.id)
      break
    }
  }

  return c.json({ received: true })
})

async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts = header.split(',')
    const ts = parts.find(p => p.startsWith('t='))?.slice(2)
    const v1 = parts.find(p => p.startsWith('v1='))?.slice(3)
    if (!ts || !v1) return false

    const signedPayload = `${ts}.${payload}`
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
    return expected === v1
  } catch {
    return false
  }
}

Deno.serve(app.fetch)
