type EmailLayoutProps = {
  projectName: string
  logoUrl?: string
  customFooter?: string | null
  unsubscribeUrl: string
  children: React.ReactNode
}

// Shared wrapper for all transactional email templates.
// Subject + enabled + custom_footer come from email_templates DB table.
export function EmailLayout({
  projectName,
  logoUrl,
  customFooter,
  unsubscribeUrl,
  children,
}: EmailLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          body { font-family: system-ui, sans-serif; background: #f8f9fa; margin: 0; padding: 0; }
          .container { max-width: 560px; margin: 32px auto; background: white; border-radius: 12px;
                       overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
          .header { background: #6366f1; padding: 24px 32px; color: white; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
          .body { padding: 32px; color: #111827; line-height: 1.6; }
          .footer { padding: 16px 32px; border-top: 1px solid #e5e7eb;
                    font-size: 12px; color: #6b7280; }
          a { color: #6366f1; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            {logoUrl && <img src={logoUrl} alt={projectName} height={32} style={{ marginBottom: 8 }} />}
            <h1>{projectName}</h1>
          </div>
          <div className="body">{children}</div>
          <div className="footer">
            {customFooter && <p>{customFooter}</p>}
            <p>
              <a href={unsubscribeUrl}>Unsubscribe</a> from these emails.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
