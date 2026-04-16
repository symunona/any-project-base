export const PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
export const MIN_PAGE_SIZE = 1

export const DEBOUNCE_MS = 300

export const ROLES = ['user', 'support', 'admin'] as const
export type Role = typeof ROLES[number]

export const PRICING_MODELS = ['none', 'credits', 'subscription_credits', 'tiers'] as const
export const ANALYTICS_OPTIONS = ['none', 'posthog'] as const
export const PUSH_OPTIONS = ['none', 'firebase'] as const
