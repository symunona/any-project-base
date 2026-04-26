import { Hono } from 'npm:hono'
import { users } from './routes/users.ts'
import { support } from './routes/support.ts'
import { usage } from './routes/usage.ts'
import { deployments } from './routes/deployments.ts'
import { magicLinks } from './routes/magic-links.ts'
import { llm } from './routes/llm.ts'

const app = new Hono().basePath('/api')
  .route('/users', users)
  .route('/support', support)
  .route('/usage', usage)
  .route('/deployments', deployments)
  .route('/magic-links', magicLinks)
  .route('/llm', llm)

// Health check
app.get('/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }))

export type AppType = typeof app

Deno.serve(app.fetch)
