import { useSearchParams, useNavigate } from 'react-router'
import { config } from '@any-project-base/commons'
import { ProfilePage } from './ProfilePage'
import { BillingPage } from './BillingPage'
import { SupportPage } from '../SupportPage'

type TabId = 'profile' | 'billing' | 'support'

const ALL_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'profile', label: 'Profile' },
  { id: 'billing', label: 'Billing' },
  { id: 'support', label: 'Support' },
]

export function SettingsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const activeTab = (searchParams.get('tab') ?? 'profile') as TabId

  const tabs = config.pricingModel === 'none'
    ? ALL_TABS.filter(t => t.id !== 'billing')
    : ALL_TABS

  const setTab = (tab: TabId) => {
    void navigate(`/settings?tab=${tab}`, { replace: true })
  }

  return (
    <div>
      <nav className="flex gap-1 mb-6 border-b border-[var(--color-border)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setTab(tab.id) }}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {activeTab === 'profile' && <ProfilePage />}
      {activeTab === 'billing' && <BillingPage />}
      {activeTab === 'support' && <SupportPage />}
    </div>
  )
}
