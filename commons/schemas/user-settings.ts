import { z } from 'zod'

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
  onboarding_step: z.number().int().min(0).default(0),
  dark_mode: z.boolean().default(false),
  notification_settings: NotificationSettingsSchema,
})

export type UserSettingsInput = z.input<typeof UserSettingsSchema>
export type UserSettings = z.output<typeof UserSettingsSchema>

// Always parse settings through this schema — never read raw jsonb.
export function parseUserSettings(raw: unknown): UserSettings {
  return UserSettingsSchema.parse(raw ?? {})
}
