import { EmailLayout } from './_components/EmailLayout'

type SupportReplyProps = {
  projectName: string
  replyBody: string
  conversationUrl: string
  unsubscribeUrl: string
  customFooter?: string | null
}

export function SupportReplyEmail({ projectName, replyBody, conversationUrl, unsubscribeUrl, customFooter }: SupportReplyProps) {
  return (
    <EmailLayout projectName={projectName} unsubscribeUrl={unsubscribeUrl} customFooter={customFooter ?? null}>
      <h2 style={{ marginTop: 0 }}>New reply to your support request</h2>
      <blockquote style={{ borderLeft: '3px solid #6366f1', paddingLeft: 16, color: '#374151' }}>
        {replyBody}
      </blockquote>
      <p>
        <a href={conversationUrl} style={{
          display: 'inline-block', padding: '12px 24px', background: '#6366f1',
          color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600,
        }}>
          View conversation
        </a>
      </p>
    </EmailLayout>
  )
}
