type Variant = 'success' | 'warning' | 'danger' | 'neutral' | 'accent'

type BadgeProps = {
  variant?: Variant
  children: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  danger:  'bg-[var(--color-danger-bg,#ef444422)] text-[var(--color-danger)]',
  neutral: 'bg-[var(--color-neutral-bg)] text-[var(--color-neutral)]',
  accent:  'bg-[var(--color-accent-bg)] text-[var(--color-accent)]',
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span className={[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
      variantClasses[variant],
    ].join(' ')}>
      {children}
    </span>
  )
}
