import { config } from '../config'

type Variant = 'client' | 'admin'

type AuthLayoutProps = {
  children: React.ReactNode
  variant?: Variant
}

const BRAND_GRADIENT: Record<Variant, string> = {
  client: 'linear-gradient(150deg, #1D4ED8 0%, #2563EB 45%, #0891B2 100%)',
  admin:  'linear-gradient(150deg, #0F172A 0%, #1E293B 45%, #3730A3 100%)',
}

const FORM_BG: Record<Variant, string> = {
  client: 'linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 60%, #E0F2FE 100%)',
  admin:  'linear-gradient(160deg, #F1F5F9 0%, #F8FAFC 60%, #EEF2FF 100%)',
}

export function AuthLayout({ children, variant = 'client' }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: FORM_BG[variant] }}
    >
      <div className="w-full" style={{ maxWidth: 420 }}>
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-small.svg" alt={config.projectName} className="w-16 h-16 mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">{config.projectName}</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-3xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.10)' }}
        >
          <div className="px-8 py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
