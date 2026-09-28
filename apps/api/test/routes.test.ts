import { describe, expect, it } from 'vitest'
import { app } from '../src/app'
import type { Env } from '../src/env'

interface ErrorEnvelope {
  success: false
  error: { code: string; message: string; details?: { path: string; message: string }[] }
}

interface DataEnvelope {
  success: true
  data: Record<string, unknown>
}

async function readBody(res: Response): Promise<ErrorEnvelope | DataEnvelope> {
  const parsed: unknown = await res.json()
  return parsed as ErrorEnvelope | DataEnvelope
}

/**
 * These exercise the envelope, the security headers, and the middleware
 * ordering. Anything that needs a real D1 round trip is covered by the smoke
 * tests in Task 11 step 9 against `wrangler dev`.
 */
/**
 * A D1 binding stub good enough for the statements these tests issue. `empty`
 * lets a test simulate the database being unreachable.
 */
function d1Stub(options: { empty?: boolean } = {}): D1Database {
  // Drizzle's D1 driver calls prepare(sql).bind(...params).all()/.run().
  const statement = {
    bind: () => statement,
    all: async () => ({ results: [], success: true, meta: {} }),
    first: async () => null,
    run: async () => ({ success: true, meta: { changes: 0 } }),
    raw: async () => [],
  }
  const prepare = () => {
    if (options.empty === true) throw new Error('D1 unreachable')
    return statement
  }
  return { prepare, batch: async () => [], exec: async () => ({ count: 0, duration: 0 }) } as unknown as D1Database
}

function env(overrides: Partial<Env> = {}): Env {
  return {
    DB: d1Stub(),
    MEDIA: {
      list: async () => ({ objects: [] }),
    } as unknown as R2Bucket,
    RATE_LIMITER: {
      idFromName: () => 'stub',
      get: () => ({
        fetch: async () =>
          Response.json({ allowed: true, remaining: 59, retryAfterSeconds: 60 }),
      }),
    } as unknown as DurableObjectNamespace,
    ENVIRONMENT: 'development',
    ...overrides,
  }
}

const ENV = env()

describe('Phase 1 endpoint surface', () => {
  it('returns the health envelope', async () => {
    const res = await app.request('/api/health', {}, ENV)
    expect(res.status).toBe(200)
    const body = await readBody(res)
    expect(body.success).toBe(true)
    if (!body.success) return
    expect(body.data).toMatchObject({ status: 'ok' })
  })

  it('degrades to 503 when D1 is unreachable', async () => {
    const res = await app.request(
      '/api/health',
      {},
      env({ DB: d1Stub({ empty: true }) }),
    )
    expect(res.status).toBe(503)
    const body = await readBody(res)
    expect(body.success).toBe(true)
    if (!body.success) return
    expect(body.data).toMatchObject({ status: 'degraded', d1: 'unreachable' })
  })

  it('sets security headers and a request id on every response', async () => {
    const res = await app.request('/api/health', {}, ENV)
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(res.headers.get('X-Request-Id')).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('omits HSTS in development', async () => {
    const res = await app.request('/api/health', {}, ENV)
    expect(res.headers.get('Strict-Transport-Security')).toBeNull()
  })

  it('sends HSTS outside development', async () => {
    const res = await app.request(
      '/api/health',
      {},
      env({ ENVIRONMENT: 'production' }),
    )
    expect(res.headers.get('Strict-Transport-Security')).toContain('max-age=63072000')
  })

  it('issues a CSRF cookie on a safe request', async () => {
    const res = await app.request('/api/health', {}, ENV)
    expect(res.headers.get('Set-Cookie')).toContain('mma_csrf=')
  })

  it('rejects a register POST with a malformed body as 400 with field details', async () => {
    const res = await app.request(
      '/api/auth/register',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: 'mma_csrf=t',
          'x-csrf-token': 't',
        },
        body: JSON.stringify({ email: 'nope', username: 'x' }),
      },
      ENV,
    )
    expect(res.status).toBe(400)
    const body = await readBody(res)
    expect(body.success).toBe(false)
    if (body.success) return
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details?.map((issue) => issue.path)).toContain('email')
  })

  it('rejects a register POST without a CSRF token as 403', async () => {
    const res = await app.request(
      '/api/auth/register',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'a@b.com',
          username: 'abc',
          displayName: 'A',
          password: 'a-long-enough-password',
        }),
      },
      ENV,
    )
    expect(res.status).toBe(403)
    const body = await readBody(res)
    expect(body.success).toBe(false)
    if (body.success) return
    expect(body.error.code).toBe('CSRF_TOKEN_INVALID')
  })

  it('401s GET /api/auth/me without a session', async () => {
    const res = await app.request('/api/auth/me', {}, ENV)
    expect(res.status).toBe(401)
  })

  it('401s a POST /api/auth/logout without a session', async () => {
    const res = await app.request('/api/auth/logout', { method: 'POST' }, ENV)
    expect([401, 403]).toContain(res.status)
  })

  it('refuses admin metrics without a session', async () => {
    const res = await app.request('/api/admin/metrics', {}, ENV)
    expect([401, 403]).toContain(res.status)
  })

  it('404s an unknown path through the envelope', async () => {
    const res = await app.request('/api/does-not-exist', {}, ENV)
    expect(res.status).toBe(404)
    const body = await readBody(res)
    expect(body.success).toBe(false)
    if (body.success) return
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('404s a traversal attempt in an image key', async () => {
    const res = await app.request('/img/..%2F..%2Fetc%2Fpasswd', {}, ENV)
    expect([403, 404]).toContain(res.status)
  })
})
