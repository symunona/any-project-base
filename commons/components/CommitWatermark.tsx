import { config } from '../config'

// Fixed bottom-right, dim, pointer-events: none.
// Shows: "a1b2c3d · 2026-04-16" or "dev" if env vars not set.
export function CommitWatermark() {
  const sha = config.commitSha
  const date = config.commitDate ? config.commitDate.slice(0, 10) : undefined
  const label = sha ? `${sha}${date ? ` · ${date}` : ''}` : 'dev'

  return (
    <div
      className="fixed bottom-2 right-3 z-50 text-xs opacity-30 pointer-events-none select-none font-mono"
      aria-hidden="true"
    >
      {label}
    </div>
  )
}
