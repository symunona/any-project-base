import { Redirect } from 'expo-router'
import { useAuth } from '@any-project-base/commons'

// Root redirect: check auth + onboarding state
export default function Index() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) return <Redirect href="/(auth)/login" />

  const step = user.settings.onboarding_step ?? 0
  if (step < 2) return <Redirect href="/(onboarding)/step1" />

  return <Redirect href="/(app)/dashboard" />
}
