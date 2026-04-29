import { LoginPage, useSystemSettings, CLIENT_DEV_USERS } from '@any-project-base/commons'
import type { SystemSettings } from '@any-project-base/commons'

function deriveRegistrationStatus(settings: SystemSettings | undefined) {
  if (!settings) return undefined
  if (settings.invite_only) return 'invite_only' as const
  if (settings.registration_open) return 'open' as const
  return 'closed' as const
}

export function ClientLoginPage() {
  const { data: settings } = useSystemSettings()
  const registrationStatus = deriveRegistrationStatus(settings)

  return (
    <LoginPage
      redirectTo="/"
      showForgotPassword
      devUsers={CLIENT_DEV_USERS}
      {...(registrationStatus !== undefined && { registrationStatus })}
    />
  )
}
