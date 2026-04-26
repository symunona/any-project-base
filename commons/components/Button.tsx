import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-[var(--color-primary)] text-white hover:brightness-110 shadow-sm',
  secondary: 'bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-border)]',
  danger:    'bg-[var(--color-danger)] text-white hover:brightness-110 shadow-sm',
  ghost:     'bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-5 py-2 text-sm',
  lg: 'px-7 py-2.5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full font-medium',
        'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </button>
  )
}
