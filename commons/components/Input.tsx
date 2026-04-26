import React from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean
}

const base =
  'w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--color-surface)] ' +
  'border border-[var(--color-border)] text-[var(--color-text)] ' +
  'focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

const errorBase =
  'w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--color-surface)] ' +
  'border border-[var(--color-danger)] text-[var(--color-text)] ' +
  'focus:outline-none focus:border-[var(--color-danger)] focus:ring-1 focus:ring-[var(--color-danger)] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export function Input({ error, className, ...props }: InputProps) {
  return <input className={`${error ? errorBase : base} ${className ?? ''}`} {...props} />
}
