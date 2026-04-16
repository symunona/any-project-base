import { Step1 } from '../../src/components/onboarding/Step1'
import { useOnboarding } from '../../src/components/onboarding/useOnboarding'
import { supabase } from '@any-project-base/commons/lib/supabase'
import { useAuth } from '@any-project-base/commons'

export default function Step1Screen() {
  const { user } = useAuth()
  const { advance } = useOnboarding()

  const handleSelect = async (value: string) => {
    if (user) {
      await supabase
        .from('users')
        .update({ settings: { ...user.settings, onboarding_intent: value } })
        .eq('id', user.id)
    }
    await advance()
  }

  return <Step1 onSelect={handleSelect} />
}
