import { EmailLayout } from './_components/EmailLayout'

type PasswordResetProps = {
  projectName: string
  resetUrl: string
  unsubscribeUrl: string
  customFooter?: string | null
}

export function PasswordResetEmail({ projectName, resetUrl, unsubscribeUrl, customFooter }: PasswordResetProps) {
  return (
    <EmailLayout projectName={projectName} unsubscribeUrl={unsubscribeUrl} customFooter={customFooter ?? null}>
      <h2 style={{ marginTop: 0 }}>Reset your password</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p>
        <a href={resetUrl} style={{
          display: 'inline-block', padding: '12px 24px', background: '#6366f1',
          color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600,
        }}>
          Reset password
        </a>
      </p>
      <p style={{ fontSize: 13, color: '#6b7280' }}>
        If you didn&apos;t request this, ignore this email.
      </p>
    </EmailLayout>
  )
}
