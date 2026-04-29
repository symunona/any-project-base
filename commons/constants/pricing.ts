export type ModelPricing = {
  inputPerMtok: number
  outputPerMtok: number
  cacheWritePerMtok?: number
  cacheReadPerMtok?: number
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Claude 4.x
  'claude-opus-4-7':             { inputPerMtok: 15.00, outputPerMtok: 75.00, cacheWritePerMtok: 18.75, cacheReadPerMtok: 1.50 },
  'claude-sonnet-4-6':           { inputPerMtok: 3.00,  outputPerMtok: 15.00, cacheWritePerMtok: 3.75,  cacheReadPerMtok: 0.30 },
  'claude-haiku-4-5-20251001':   { inputPerMtok: 0.80,  outputPerMtok: 4.00,  cacheWritePerMtok: 1.00,  cacheReadPerMtok: 0.08 },
  // Claude 3.x (legacy records)
  'claude-3-5-sonnet-20241022':  { inputPerMtok: 3.00,  outputPerMtok: 15.00 },
  'claude-3-5-haiku-20241022':   { inputPerMtok: 0.80,  outputPerMtok: 4.00 },
  'claude-3-opus-20240229':      { inputPerMtok: 15.00, outputPerMtok: 75.00 },
  'claude-3-haiku-20240307':     { inputPerMtok: 0.25,  outputPerMtok: 1.25 },
}

// 1 credit = $0.01; users pay 2× API cost
export const CREDITS_PER_USD = 100
export const CREDIT_MARKUP   = 2.0

export const CREDIT_PACKS = [
  { credits: 100,  priceUsd: 5.00,   label: '100 credits',   priceLabel: '$5'   },
  { credits: 500,  priceUsd: 20.00,  label: '500 credits',   priceLabel: '$20'  },
  { credits: 1000, priceUsd: 40.00,  label: '1,000 credits', priceLabel: '$40'  },
  { credits: 5000, priceUsd: 150.00, label: '5,000 credits', priceLabel: '$150' },
] as const

export type CreditPack = typeof CREDIT_PACKS[number]

export function calcCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING[model]
  if (!p) return 0
  return (inputTokens / 1_000_000) * p.inputPerMtok + (outputTokens / 1_000_000) * p.outputPerMtok
}

export function calcCreditsUsed(costUsd: number): number {
  return Math.max(1, Math.ceil(costUsd * CREDITS_PER_USD * CREDIT_MARKUP))
}

export function calcCreditsPriceUsd(credits: number): number {
  const pack = CREDIT_PACKS.find(p => p.credits === credits)
  if (pack) return pack.priceUsd
  // Custom amount: proportional to 100-credit rate
  const baseRate = CREDIT_PACKS[0].priceUsd / CREDIT_PACKS[0].credits
  return Math.ceil(credits * baseRate * 100) / 100
}
