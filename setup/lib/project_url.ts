import { getEnv } from './env'
import { log } from '@clack/prompts'

export function getSupabaseUrl(): string {
  return getEnv('VITE_SUPABASE_URL')
}

export function getSiteUrl(): string {
  return getEnv('SITE_URL')
}

export function getStripeWebhookUrl(): string {
  return `${getSupabaseUrl()}/functions/v1/stripe-webhook`
}

export function getTossWebhookUrl(): string {
  return `${getSupabaseUrl()}/functions/v1/toss-webhook`
}

/**
 * Warns (but does not throw) if VITE_SUPABASE_URL is unset or localhost.
 * Returns true if the URL looks public, false otherwise.
 */
export function warnIfNoPublicUrl(): boolean {
  const url = getSupabaseUrl()

  if (!url) {
    log.warn('VITE_SUPABASE_URL not set — cannot derive webhook URL.')
    log.warn('Run supabase setup first:  just setup-supabase')
    return false
  }

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    log.warn('VITE_SUPABASE_URL is localhost — external services cannot reach it.')
    log.warn('Set up a public URL first:  just setup-nginx  or  just deploy')
    log.warn('Then re-run this step to get the correct webhook URL.')
    return false
  }

  return true
}
