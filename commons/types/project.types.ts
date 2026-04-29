import type { Role } from '../constants'

export type { Role }

export type PricingModel = 'none' | 'credits' | 'subscription_credits' | 'tiers'
export type AuthProvider = 'email' | 'google' | 'facebook' | 'apple' | 'github' | 'discord'
export type AppEnv = 'local' | 'test' | 'prod'
export type Platform = 'android' | 'ios' | 'web'

export type User = {
  id: string
  name: string | null
  email: string
  role: Role
  locale: string
  settings: UserSettings
  created_at: string
  updated_at: string
}

export type UserSettings = {
  onboarding_step: number
  dark_mode: boolean
  notification_settings: {
    email: {
      support_reply: boolean
      credit_depletion: boolean
      payment_failed: boolean
    }
    push: {
      support_reply: boolean
    }
  }
}

export type Device = {
  id: string
  user_id: string
  token: string
  platform: Platform
  last_seen: string
  created_at: string
}

export type SupportConversationStatus = 'new' | 'open' | 'waiting_on_customer' | 'closed'

export type SupportConversation = {
  id: string
  user_id: string
  status: SupportConversationStatus
  subject: string | null
  created_at: string
  updated_at: string
}

export type SupportMessage = {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_role: 'admin' | 'support' | 'user' | null
  body: string
  created_at: string
}

export type UsageRecord = {
  id: string
  user_id: string
  model: string
  input_tokens: number | null
  output_tokens: number | null
  cost_usd: number | null
  credits_used: number | null
  endpoint: string | null
  created_at: string
}

export type Deployment = {
  id: string
  env: string
  sha: string
  branch: string
  deployed_at: string
}

export type NotificationSettings = UserSettings['notification_settings']

export type CreditAdjustment = {
  id: string
  user_id: string
  admin_id: string | null
  delta: number
  note: string | null
  source: string
  created_at: string
}

export type SystemSettings = {
  registration_open:  boolean
  maintenance_mode:   boolean
  invite_only:        boolean
  onboarding_enabled: boolean
}

export type TemplateVariable = {
  name:        string
  description: string
  example:     string
  supabase_go?: string  // auth templates only — the Go template equivalent
}

export type EmailTemplate = {
  id:            string
  type:          'app' | 'auth'
  subject:       string
  sender_name:   string
  enabled:       boolean
  custom_footer: string | null
  body_html:     string | null
  variables:     TemplateVariable[]
  updated_at:    string
}
