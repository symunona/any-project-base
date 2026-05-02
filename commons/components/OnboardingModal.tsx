import { useState, useEffect } from 'react'
import { fetchApi } from '../api/fetchApi'
import { config } from '../config'
import { Button } from './Button'
import type { UserSettings } from '../types/project.types'

type OnboardingModalProps = {
  settings: UserSettings
  onComplete: (updatedSettings: UserSettings) => void
}

export function OnboardingModal({ settings, onComplete }: OnboardingModalProps) {
  const [dismissed, setDismissed] = useState(false)
  const isDone = dismissed || (settings.onboarding_step ?? 0) >= 1

  const dismiss = () => setDismissed(true)

  // Escape key
  useEffect(() => {
    if (isDone) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    document.addEventListener('keydown', handler)
    return () => { document.removeEventListener('keydown', handler) }
  }, [isDone])

  // Persist to API after dismiss (fire-and-forget, non-blocking)
  useEffect(() => {
    if (!dismissed) return
    const updated = { ...settings, onboarding_step: 1 }
    void fetchApi(`${config.apiUrl}/users/me/settings`, {
      method: 'PATCH',
      body: JSON.stringify({ onboarding_step: 1 }),
    })
    onComplete(updated)
  }, [dismissed]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isDone) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Welcome! See how it works</h2>
          <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src="https://www.youtube.com/embed/TJYOkZz6Dck"
              title="Product intro"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none' }}
            />
          </div>
        </div>
        <div className="flex justify-end px-6 pb-6">
          <Button onClick={dismiss}>Got it, don't show again</Button>
        </div>
      </div>
    </div>
  )
}
