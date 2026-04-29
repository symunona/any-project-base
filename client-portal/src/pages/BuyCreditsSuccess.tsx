import { useSearchParams, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Card, CardBody, Button } from '@any-project-base/commons'

export function BuyCreditsSuccess() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()
  const qc        = useQueryClient()
  const credits   = params.get('credits') ?? '0'

  useEffect(() => {
    void qc.invalidateQueries({ queryKey: ['credits'] })
  }, [qc])

  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <Card>
        <CardBody className="py-12 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center text-3xl">
            ✓
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Purchase successful</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            <strong className="text-[var(--color-text)]">{parseInt(credits, 10).toLocaleString()} credits</strong> have been added to your account.
          </p>
          <Button onClick={() => { void navigate('/') }}>Go to dashboard</Button>
        </CardBody>
      </Card>
    </div>
  )
}
