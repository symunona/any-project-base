import { EmailLayout } from './_components/EmailLayout'

type WelcomeProps = {
  projectName: string
  userName?: string
  loginUrl: string
  unsubscribeUrl: string
  customFooter?: string | null
}

export function WelcomeEmail({ projectName, userName, loginUrl, unsubscribeUrl, customFooter }: WelcomeProps) {
  return (
    <EmailLayout projectName={projectName} unsubscribeUrl={unsubscribeUrl} customFooter={customFooter ?? null}>
      <h2 style={{ marginTop: 0 }}>Welcome{userName ? `, ${userName}` : ''}!</h2>
      <p>Your account is ready. Click below to get started.</p>
      <p>
        <a href={loginUrl} style={{
          display: 'inline-block', padding: '12px 24px', background: '#6366f1',
          color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600,
        }}>
          Get started
        </a>
      </p>
    </EmailLayout>
  )
}
