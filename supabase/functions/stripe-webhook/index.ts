import { getAdminClient } from '../_shared/db.ts'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 503 })

  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  const isValid = await verifyStripeSignature(body, signature, webhookSecret)
  if (!isValid) return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })

  const event = JSON.parse(body) as { type: string; id: string; data: { object: Record<string, unknown> } }
  const admin = getAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session['client_reference_id'] as string
      const credits = session['metadata'] ? Number((session['metadata'] as Record<string, string>)['credits']) : 0
      const amountUsd = (session['amount_total'] as number) / 100

      const { error: txErr, count } = await admin.from('stripe_transactions').upsert({
        user_id: userId,
        stripe_event_id: event.id,
        type: 'credit_purchase',
        amount_usd: amountUsd,
        credits_delta: credits,
      }, { onConflict: 'stripe_event_id', ignoreDuplicates: true, count: 'exact' })

      if (txErr) { console.error('[stripe-webhook] tx insert error:', txErr.message); break }
      // count=0 means duplicate event already processed — skip crediting
      if (count === 0) break

      if (credits > 0 && userId) {
        const { data: current } = await admin.from('credits').select('balance').eq('user_id', userId).single()
        const newBalance = (current?.balance ?? 0) + credits
        await admin.from('credits').upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() })
        await admin.from('credit_adjustments').insert({ user_id: userId, delta: credits, source: 'stripe' })
      }
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
      await admin.from('stripe_transactions').upsert({
        stripe_event_id: event.id,
        type: 'subscription_payment',
        amount_usd: (invoice['amount_paid'] as number) / 100,
      }, { onConflict: 'stripe_event_id', ignoreDuplicates: true })
      break
    }
    case 'invoice.payment_failed': {
      console.log('[stripe-webhook] Payment failed:', event.id)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
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
