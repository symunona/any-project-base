import { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '@any-project-base/commons'
import { supabase } from '@any-project-base/commons/lib/supabase'

export const ONBOARDING_STEPS = 2

export function useOnboarding() {
  const { user } = useAuth()
  const router = useRouter()

  const currentStep: number = user?.settings.onboarding_step ?? 0

  const advance = useCallback(async () => {
    if (!user) return
    const next = currentStep + 1
    await supabase
      .from('users')
      .update({ settings: { ...user.settings, onboarding_step: next } })
      .eq('id', user.id)

    if (next >= ONBOARDING_STEPS) {
      router.replace('/(app)/dashboard')
    } else {
      router.push(`/(onboarding)/step${next + 1}` as never)
    }
  }, [user, currentStep, router])

  const skip = useCallback(async () => {
    if (!user) return
    await supabase
      .from('users')
      .update({ settings: { ...user.settings, onboarding_step: ONBOARDING_STEPS } })
      .eq('id', user.id)
    router.replace('/(app)/dashboard')
  }, [user, router])

  return { currentStep, advance, skip }
}
