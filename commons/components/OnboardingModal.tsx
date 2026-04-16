import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { fetchApi } from '../api/fetchApi'
import { config } from '../config'
import type { UserSettings } from '../types/project.types'

type OnboardingModalProps = {
  settings: UserSettings
  onComplete: (updatedSettings: UserSettings) => void
  steps: Array<{
    title: string
    content: React.ReactNode
  }>
}

// Renders over the dashboard. Not blocking. Reads + writes onboarding_step.
export function OnboardingModal({ settings, onComplete, steps }: OnboardingModalProps) {
  const [currentSettings, setCurrentSettings] = useState(settings)
  const step = currentSettings.onboarding_step

  const isDone = step >= steps.length

  const advance = async (nextStep: number) => {
    const updated = { ...currentSettings, onboarding_step: nextStep }
    setCurrentSettings(updated)
    await fetchApi(`${config.apiUrl}/users/me/settings`, {
      method: 'PATCH',
      body: JSON.stringify({ onboarding_step: nextStep }),
    })
    if (nextStep >= steps.length) {
      onComplete(updated)
    }
  }

  if (isDone) return null

  const current = steps[step]
  if (!current) return null

  return (
    <Modal
      open={!isDone}
      onClose={() => { void advance(steps.length) }}
      title={current.title}
      footer={
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => { void advance(steps.length) }}
            className="text-sm text-[var(--color-text-muted,#6b7280)] hover:underline mr-auto"
          >
            Skip for now
          </button>
          <Button onClick={() => { void advance(step + 1) }}>
            {step < steps.length - 1 ? 'Next' : 'Done'}
          </Button>
        </div>
      }
    >
      <div className="mb-2 text-xs text-[var(--color-text-muted,#6b7280)]">
        Step {step + 1} of {steps.length}
      </div>
      {current.content}
    </Modal>
  )
}
