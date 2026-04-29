import { useNavigate } from 'react-router'
import { Card, CardBody, Button } from '@any-project-base/commons'

export function BuyCreditsCancel() {
  const navigate = useNavigate()

  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <Card>
        <CardBody className="py-12 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center text-3xl">
            ✕
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Purchase cancelled</h1>
          <p className="text-sm text-[var(--color-text-muted)]">No credits were added. You can try again whenever you're ready.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { void navigate('/') }}>Dashboard</Button>
            <Button onClick={() => { void navigate('/buy-credits') }}>Try again</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
