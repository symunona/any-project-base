import { EmailLayout } from './_components/EmailLayout'

type MagicLinkProps = {
  projectName: string
  loginUrl: string
  unsubscribeUrl: string
  customFooter?: string | null
}

export function MagicLinkEmail({ projectName, loginUrl, unsubscribeUrl, customFooter }: MagicLinkProps) {
  return (
    <EmailLayout projectName={projectName} unsubscribeUrl={unsubscribeUrl} customFooter={customFooter}>
      <h2 style={{ marginTop: 0 }}>Your login link</h2>
      <p>Click below to sign in. This link can only be used once and expires in 1 hour.</p>
      <p>
        <a href={loginUrl} style={{
          display: 'inline-block', padding: '12px 24px', background: '#6366f1',
          color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600,
        }}>
          Sign in
        </a>
      </p>
      <p style={{ fontSize: 13, color: '#6b7280' }}>
        If you didn&apos;t request this, ignore this email.
      </p>
    </EmailLayout>
  )
}
