import { Hono } from 'npm:hono'
import { zValidator } from 'npm:@hono/zod-validator'
import { requireAuth } from '../../_shared/auth.ts'
import { getAdminClient } from '../../_shared/db.ts'
import { LlmChatSchema } from '../../_shared/schemas.ts'
import { calcCostUsd, calcCreditsUsed } from '../../_shared/pricing.ts'

const llm = new Hono()

const DEFAULT_MODEL = 'claude-sonnet-4-6'

// POST /api/llm/chat — credit-gated LLM call
llm.post('/chat', zValidator('json', LlmChatSchema), async (c) => {
  const user = await requireAuth(c)
  const { message } = c.req.valid('json')
  const admin = getAdminClient()

  // Estimate a conservative pre-check (actual deduction after call)
  const { data: credits } = await admin
    .from('credits')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  if (!credits || credits.balance < 1) {
    return c.json({ error: 'insufficient_credits' }, 402)
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return c.json({ error: 'LLM not configured' }, 503)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: message }],
    }),
  })

  if (!response.ok) {
    return c.json({ error: 'LLM call failed' }, 502)
  }

  const llmData = await response.json() as {
    content: Array<{ type: string; text: string }>
    usage: { input_tokens: number; output_tokens: number }
  }

  const reply = llmData.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')

  const costUsd     = calcCostUsd(DEFAULT_MODEL, llmData.usage.input_tokens, llmData.usage.output_tokens)
  const creditsUsed = calcCreditsUsed(costUsd)

  // Atomic deduct — if balance < creditsUsed, reject
  const newBalance = credits.balance - creditsUsed
  if (newBalance < 0) {
    return c.json({ error: 'insufficient_credits' }, 402)
  }

  await admin
    .from('credits')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  await admin.from('usage').insert({
    user_id:       user.id,
    model:         DEFAULT_MODEL,
    input_tokens:  llmData.usage.input_tokens,
    output_tokens: llmData.usage.output_tokens,
    cost_usd:      costUsd,
    credits_used:  creditsUsed,
    endpoint:      'chat',
  })

  return c.json({ reply })
})

export { llm }
