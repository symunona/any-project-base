#!/usr/bin/env tsx
/**
 * Mock payment server — dev only.
 * Mimics a Stripe Checkout redirect flow without requiring real credentials.
 *
 * Endpoints:
 *   POST /sessions           — create checkout session (called by API)
 *   GET  /c/:id              — checkout page (user lands here after redirect)
 *   POST /c/:id/approve      — user approves → API adds credits → redirect to successUrl
 *   POST /c/:id/deny         — user denies  → redirect to cancelUrl
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'

const PORT   = Number(process.env['MOCK_PAYMENT_PORT'] ?? 5242)
const API_URL = process.env['VITE_API_URL'] ?? 'http://localhost:54321/functions/v1/api'
const SECRET = process.env['MOCK_PAYMENT_SECRET'] ?? 'dev-mock-secret'

interface Session {
  id: string
  userId: string
  credits: number
  priceLabel: string
  successUrl: string
  cancelUrl: string
  status: 'pending' | 'approved' | 'denied'
}

const sessions = new Map<string, Session>()

// ── helpers ────────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let buf = ''
    req.on('data', (c: Buffer) => { buf += c.toString() })
    req.on('end',  () => resolve(buf))
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) })
  res.end(payload)
}

function redirect(res: ServerResponse, url: string) {
  res.writeHead(302, { Location: url })
  res.end()
}

function cors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

// ── HTML payment page ──────────────────────────────────────────────────────

function renderPage(s: Session): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Provider Mock</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    }

    /* ── top header bar ── */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      height: 56px;
      background: rgba(255,255,255,0.04);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      backdrop-filter: blur(8px);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 700;
      color: rgba(255,255,255,0.9);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .brand-icon {
      width: 28px; height: 28px;
      background: linear-gradient(135deg, #a78bfa, #60a5fa);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    }
    .mock-pill {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #fbbf24;
      background: rgba(251,191,36,0.12);
      border: 1px solid rgba(251,191,36,0.3);
      padding: 3px 10px;
      border-radius: 999px;
    }
    .secure-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: rgba(255,255,255,0.4);
    }

    /* ── main content ── */
    main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }
    .card {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.10);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 40px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5);
    }
    .merchant {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .merchant-logo {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .merchant-name { font-size: 15px; font-weight: 600; color: #fff; }
    .merchant-desc { font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 2px; }

    .amount-block { text-align: center; margin: 4px 0 28px; }
    .amount {
      font-size: 52px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .amount-sub {
      font-size: 13px;
      color: rgba(255,255,255,0.4);
      margin-top: 6px;
    }

    .details {
      background: rgba(255,255,255,0.04);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      padding: 5px 0;
    }
    .row + .row { border-top: 1px solid rgba(255,255,255,0.05); }
    .row .lbl { color: rgba(255,255,255,0.45); }
    .row .val { font-weight: 600; color: rgba(255,255,255,0.85); }

    .actions { display: flex; gap: 10px; }
    .btn {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
      letter-spacing: 0.02em;
    }
    .btn:hover  { opacity: 0.88 }
    .btn:active { transform: scale(0.97) }
    .approve {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      box-shadow: 0 4px 20px rgba(99,102,241,0.4);
    }
    .deny {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.10);
      color: rgba(255,255,255,0.55);
    }
    form { display: contents }

    /* ── footer ── */
    footer {
      padding: 14px;
      text-align: center;
      font-size: 11px;
      color: rgba(255,255,255,0.2);
      letter-spacing: 0.04em;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-icon">💳</div>
      [PAYMENT PROVIDER MOCK]
    </div>
    <div class="mock-pill">dev environment</div>
    <div class="secure-badge">🔒 Simulated secure connection</div>
  </header>

  <main>
    <div class="card">
      <div class="merchant">
        <div class="merchant-logo">✦</div>
        <div>
          <div class="merchant-name">any-project-base</div>
          <div class="merchant-desc">Credit purchase · One-time payment</div>
        </div>
      </div>

      <div class="amount-block">
        <div class="amount">${s.priceLabel}</div>
        <div class="amount-sub">due today</div>
      </div>

      <div class="details">
        <div class="row">
          <span class="lbl">Credits</span>
          <span class="val">${s.credits.toLocaleString()} credits</span>
        </div>
        <div class="row">
          <span class="lbl">Session</span>
          <span class="val" style="font-family:monospace;font-size:11px">${s.id.slice(0, 8)}…</span>
        </div>
      </div>

      <div class="actions">
        <form method="POST" action="/c/${s.id}/approve">
          <button class="btn approve" type="submit">Approve payment</button>
        </form>
        <form method="POST" action="/c/${s.id}/deny">
          <button class="btn deny" type="submit">Deny</button>
        </form>
      </div>
    </div>
  </main>

  <footer>No real payment is processed — mock server only</footer>
</body>
</html>`
}

// ── router ─────────────────────────────────────────────────────────────────

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  cors(res)

  const method = req.method ?? 'GET'
  const path   = new URL(req.url ?? '/', `http://localhost:${PORT}`).pathname

  // CORS preflight
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // POST /sessions — create session (called by main API)
  if (method === 'POST' && path === '/sessions') {
    try {
      const body = JSON.parse(await readBody(req)) as {
        userId: string; credits: number; priceLabel: string; successUrl: string; cancelUrl: string
      }
      const id = randomUUID()
      sessions.set(id, { id, ...body, status: 'pending' })
      json(res, 200, { id, checkoutUrl: `http://localhost:${PORT}/c/${id}` })
    } catch {
      json(res, 400, { error: 'Invalid body' })
    }
    return
  }

  // GET /c/:id — checkout page
  const pageMatch = path.match(/^\/c\/([0-9a-f-]+)$/)
  if (method === 'GET' && pageMatch) {
    const s = sessions.get(pageMatch[1])
    if (!s) { res.writeHead(404); res.end('Session not found'); return }
    if (s.status !== 'pending') { redirect(res, s.successUrl); return }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(renderPage(s))
    return
  }

  // POST /c/:id/approve
  const approveMatch = path.match(/^\/c\/([0-9a-f-]+)\/approve$/)
  if (method === 'POST' && approveMatch) {
    const s = sessions.get(approveMatch[1])
    if (!s || s.status !== 'pending') { json(res, 400, { error: 'Invalid session' }); return }

    s.status = 'approved'

    // Notify main API to credit the user
    try {
      const apiRes = await fetch(`${API_URL}/users/me/credits/mock-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mock-payment-secret': SECRET,
        },
        body: JSON.stringify({ userId: s.userId, credits: s.credits, sessionId: s.id }),
      })
      if (!apiRes.ok) {
        console.error('[mock-payment] API error:', apiRes.status, await apiRes.text())
      }
    } catch (err) {
      console.error('[mock-payment] Failed to notify API:', err)
    }

    redirect(res, s.successUrl)
    return
  }

  // POST /c/:id/deny
  const denyMatch = path.match(/^\/c\/([0-9a-f-]+)\/deny$/)
  if (method === 'POST' && denyMatch) {
    const s = sessions.get(denyMatch[1])
    if (!s || s.status !== 'pending') { json(res, 400, { error: 'Invalid session' }); return }
    s.status = 'denied'
    redirect(res, s.cancelUrl)
    return
  }

  res.writeHead(404); res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`\n  💳 [PAYMENT PROVIDER MOCK] running at http://localhost:${PORT}`)
  console.log(`     Approve/deny purchases at http://localhost:${PORT}/c/<session-id>\n`)
})
