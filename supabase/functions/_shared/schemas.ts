import { z } from 'npm:zod@3'

// Paging — all list endpoints use this schema. No exceptions.
export const PageQuerySchema = z.object({
  limit:  z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  order:  z.string().default('created_at'),
  dir:    z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
})

// User settings — must match commons/schemas/user-settings.ts exactly.
// Checker: setup/checks/schema_drift_check.sh diffs these.
export const NotificationSettingsSchema = z.object({
  email: z.object({
    support_reply:    z.boolean().default(true),
    credit_depletion: z.boolean().default(true),
    payment_failed:   z.boolean().default(true),
  }).default({}),
  push: z.object({
    support_reply: z.boolean().default(true),
  }).default({}),
}).default({})

export const UserSettingsSchema = z.object({
  onboarding_step:       z.number().int().min(0).default(0),
  dark_mode:             z.boolean().default(false),
  notification_settings: NotificationSettingsSchema,
})

export const UpdateUserSettingsSchema = UserSettingsSchema.partial()

// Support
export const CreateConversationSchema = z.object({
  subject: z.string().min(1).max(255).optional(),
  body:    z.string().min(1).max(10000),
})

export const SendMessageSchema = z.object({
  body: z.string().min(1).max(10000),
})

export const UpdateConversationStatusSchema = z.object({
  status: z.enum(['new', 'open', 'waiting_on_customer', 'closed']),
})

// Credits adjustment — admin only
export const AdjustCreditsSchema = z.object({
  delta: z.number().int().refine(n => n !== 0, { message: 'delta must be non-zero' }),
  note:  z.string().max(500).optional(),
})

// LLM chat
export const LlmChatSchema = z.object({
  message: z.string().min(1).max(4000),
})

// System settings — single-row config table
export const SystemSettingsSchema = z.object({
  registration_open:  z.boolean(),
  maintenance_mode:   z.boolean(),
  invite_only:        z.boolean(),
  onboarding_enabled: z.boolean(),
})

export const UpdateSystemSettingsSchema = SystemSettingsSchema.partial()
