// LLM wrapper — Anthropic/OpenAI inside. Never call SDK directly in app code.
// Server-side only (edge functions). Frontend goes through /api/llm/chat.

type CompleteOptions = {
  model?: string
  maxTokens?: number
  system?: string
}

type CompleteResult = {
  text: string
  inputTokens: number
  outputTokens: number
}

export async function complete(
  prompt: string,
  options: CompleteOptions = {},
): Promise<CompleteResult> {
  const { model = 'claude-sonnet-4-6', maxTokens = 1024, system } = options

  // Dynamic import to avoid bundling SDK in frontend
  const Anthropic = await import('@anthropic-ai/sdk').then(m => m.default)
  const client = new Anthropic()

  const msg = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')

  return {
    text,
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
  }
}

export const llm = { complete }
