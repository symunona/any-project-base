import { useAuth, OnboardingModal, useSystemSettings } from '@any-project-base/commons'
import { RemoveMeThisIsOnlyDemoLlmChat } from '../components/dashboard/RemoveMeThisIsOnlyDemoLlmChat'
import { t, msg } from '@any-project-base/commons/i18n'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: systemSettings } = useSystemSettings()
  const onboardingEnabled = systemSettings?.onboarding_enabled ?? true

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t(msg.Dashboard.title)}</h1>
      <RemoveMeThisIsOnlyDemoLlmChat />
      {onboardingEnabled && (
        <OnboardingModal
          settings={user.settings}
          onComplete={() => { /* re-fetch user */ }}
        />
      )}
    </div>
  )
}
