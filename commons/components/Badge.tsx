type Variant = 'success' | 'warning' | 'danger' | 'neutral' | 'accent'

type BadgeProps = {
  variant?: Variant
  children: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  success: 'bg-[var(--color-success-bg,#10b98122)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-bg,#f59e0b22)] text-[var(--color-warning,#f59e0b)]',
  danger:  'bg-[var(--color-danger-bg,#ef444422)] text-[var(--color-danger)]',
  neutral: 'bg-[var(--color-neutral-bg,#6b728022)] text-[var(--color-neutral,#6b7280)]',
  accent:  'bg-[var(--color-accent-bg,#06b6d422)] text-[var(--color-accent)]',
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
