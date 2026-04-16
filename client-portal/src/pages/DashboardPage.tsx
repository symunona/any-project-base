import { useAuth, OnboardingModal } from '@any-project-base/commons'
import { RemoveMeThisIsOnlyDemoLlmChat } from '../components/dashboard/RemoveMeThisIsOnlyDemoLlmChat'
import { t, msg } from '@any-project-base/commons/i18n'

const ONBOARDING_STEPS = [
  {
    title: 'What brings you here today?',
    content: (
      <div className="flex flex-col gap-2">
        {['Building a product', 'Testing the template', 'Learning', 'Other'].map(opt => (
          <button key={opt} className="text-left px-4 py-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
            {opt}
          </button>
        ))}
      </div>
    ),
  },
  {
    title: 'How did you hear about us?',
    content: (
      <input
        type="text"
        placeholder="Tell us how you found us…"
        className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
    ),
  },
]

export function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t(msg.Dashboard.title)}</h1>
      <RemoveMeThisIsOnlyDemoLlmChat />
      <OnboardingModal
        settings={user.settings}
        onComplete={() => { /* re-fetch user */ }}
        steps={ONBOARDING_STEPS}
      />
    </div>
  )
}
