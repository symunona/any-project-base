import { config } from '../config'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Brand panel — hidden on mobile ── */}
      <div className="hidden md:flex md:flex-1 flex-col justify-between
                      bg-[var(--color-primary)] text-white p-12 select-none">
        <div>
          <span className="text-xl font-bold tracking-tight opacity-90">
            {config.projectName}
          </span>
        </div>
        <div>
          <p className="text-4xl font-bold leading-tight mb-4">
            Everything wired.<br />You just ship.
          </p>
          <p className="text-base opacity-60 max-w-xs">
            Auth, billing, admin, mobile — connected from day one.
          </p>
        </div>
        <p className="text-xs opacity-30">&copy; {new Date().getFullYear()} {config.projectName}</p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center
                      bg-[var(--color-bg)] p-6 md:p-12 md:max-w-lg">

        {/* Logo / project name — mobile only */}
        <div className="md:hidden text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">
            {config.projectName}
          </h1>
        </div>

        <div className="w-full max-w-sm">
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm
                          border border-[var(--color-border)] p-8">
            {children}
          </div>
        </div>
      </div>

    </div>
  )
}
