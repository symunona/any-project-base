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
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Brand panel — desktop only ── */}
      <div
        className="hidden md:flex md:w-5/12 xl:w-2/5 flex-col justify-between p-12 select-none"
        style={{ background: BRAND_GRADIENT[variant] }}
      >
        <span className="text-lg font-bold tracking-tight text-white/90">
          {config.projectName}
        </span>
        <div>
          <p className="text-4xl font-bold leading-tight mb-4 text-white">
            Everything wired.<br />You just ship.
          </p>
          <p className="text-base text-white/55 max-w-xs">
            Auth, billing, admin, mobile — connected from day one.
          </p>
        </div>
        <p className="text-xs text-white/25">&copy; {new Date().getFullYear()} {config.projectName}</p>
      </div>

      {/* ── Form panel ── */}
      <div
        className="flex flex-1 flex-col items-center justify-center p-6 md:p-16"
        style={{ background: FORM_BG[variant] }}
      >
        {/* Mobile logo */}
        <div className="md:hidden text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">
            {config.projectName}
          </h1>
        </div>

        <div className="w-full max-w-sm">
          <div
            className="bg-white rounded-3xl p-8"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)' }}
          >
            {children}
          </div>
        </div>
      </div>

    </div>
  )
}
