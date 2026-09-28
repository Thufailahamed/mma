import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { csrf } from '../src/middleware/csrf'
import { csrfIssuer } from '../src/middleware/csrf-issuer'
import { readCookie } from '../src/middleware/cookies'
import { requireAuth } from '../src/middleware/require-auth'
import { requireRole } from '../src/middleware/require-role'
import { AppError } from '@mma/shared'
import type { SessionUser } from '../src/env'
import type { Env } from '../src/env'

const USER: SessionUser = {
  id: 'u1',
  email: 'a@b.com',
  username: 'ab',
  displayName: 'A B',
  role: 'USER',
  sessionId: 's1',
}

type TestEnv = { Bindings: Env; Variables: { user: SessionUser; requestId: string } }

/**
 * The auth middleware needs a D1 round trip, which these tests do not have.
 * resolveSession is exercised against real D1 in the endpoint suite; here the
 * focus is the control flow around it.
 */
function buildApp(options: { role?: 'USER' | 'EDITOR' | 'ADMIN' } = {}) {
  const app = new Hono<TestEnv>()

  app.onError((cause) => {
    const error = cause instanceof AppError ? cause : new AppError('INTERNAL_ERROR', 500, 'boom')
    return Response.json({ success: false, error: { code: error.code, message: error.message } }, {
      status: error.status,
    })
  })

  app.use('*', csrfIssuer)
  app.use('*', csrf)

  app.get('/api/thing', (c) => c.json({ method: 'GET' }))
  app.post('/api/thing', (c) => c.json({ method: 'POST' }))

  const authed = new Hono<TestEnv>()
  authed.use('*', requireAuth)
  authed.get('/me', (c) => c.json({ user: c.get('user') }))

  const admin = new Hono<TestEnv>()
  admin.use('*', requireAuth)
  admin.use('*', requireRole('ADMIN'))
  admin.get('/metrics', (c) => c.json({ role: c.get('user').role }))

  app.route('/api/auth', authed)
  app.route('/api/admin', admin)

  // A stub of the whole chain for role tests, bypassing D1.
  if (options.role !== undefined) {
    const stubbed = new Hono<TestEnv>()
    stubbed.use('*', async (c, next) => {
      c.set('user', { ...USER, role: options.role! })
      await next()
    })
    stubbed.use('*', requireRole('ADMIN'))
    stubbed.get('/metrics', (c) => c.json({ role: c.get('user').role }))
    app.route('/api/stub-admin', stubbed)
  }

  return { app }
}

function request(path: string, init: RequestInit = {}, cookies: Record<string, string> = {}) {
  const header = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
  return new Request(`https://mma.test${path}`, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      ...(header ? { cookie: header } : {}),
    },
  })
}

const DUMMY_ENV = {
  DB: {} as D1Database,
  MEDIA: {} as R2Bucket,
  RATE_LIMITER: {} as DurableObjectNamespace,
  SESSION_SECRET: 'a'.repeat(32),
  ENVIRONMENT: 'development',
} satisfies Env

describe('readCookie', () => {
  it('reads a named cookie and tolerates absence', () => {
    expect(readCookie(request('/', {}, { a: '1', b: '2' }), 'b')).toBe('2')
    expect(readCookie(request('/'), 'missing')).toBeUndefined()
    expect(readCookie(request('/'), 'a')).toBeUndefined()
  })

  it('does not match a cookie whose name merely ends with the target', () => {
    const req = request('/', {}, { not_mma_session: 'x' })
    expect(readCookie(req, 'mma_session')).toBeUndefined()
  })
})

describe('csrfIssuer', () => {
  it('sets a CSRF cookie on a safe request that has none', async () => {
    const { app } = buildApp()
    const res = await app.fetch(request('/api/thing'), DUMMY_ENV)
    const setCookie = res.headers.get('Set-Cookie') ?? ''
    expect(setCookie).toContain('mma_csrf=')
    expect(setCookie).toContain('SameSite=Lax')
    expect(setCookie).not.toContain('HttpOnly')
  })

  it('does not reissue a CSRF cookie the browser already holds', async () => {
    const { app } = buildApp()
    const res = await app.fetch(
      request('/api/thing', {}, { mma_csrf: 'already-have-one' }),
      DUMMY_ENV,
    )
    expect(res.headers.get('Set-Cookie')).toBeNull()
  })
})

describe('csrf', () => {
  it('passes a GET without a token', async () => {
    const { app } = buildApp()
    const res = await app.fetch(request('/api/thing'), DUMMY_ENV)
    expect(res.status).toBe(200)
  })

  it('rejects a POST with no token', async () => {
    const { app } = buildApp()
    const res = await app.fetch(
      request('/api/thing', { method: 'POST' }, { mma_csrf: 'cookie-value' }),
      DUMMY_ENV,
    )
    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toMatchObject({
      error: { code: 'CSRF_TOKEN_INVALID' },
    })
  })

  it('rejects a POST whose header does not match the cookie', async () => {
    const { app } = buildApp()
    const res = await app.fetch(
      request(
        '/api/thing',
        { method: 'POST', headers: { 'x-csrf-token': 'wrong' } },
        { mma_csrf: 'cookie-value' },
      ),
      DUMMY_ENV,
    )
    expect(res.status).toBe(403)
  })

  it('accepts a POST whose header matches the cookie', async () => {
    const { app } = buildApp()
    const res = await app.fetch(
      request(
        '/api/thing',
        { method: 'POST', headers: { 'x-csrf-token': 'cookie-value' } },
        { mma_csrf: 'cookie-value' },
      ),
      DUMMY_ENV,
    )
    expect(res.status).toBe(200)
  })
})

describe('requireAuth', () => {
  it('401s without a session cookie', async () => {
    const { app } = buildApp()
    const res = await app.fetch(request('/api/auth/me'), DUMMY_ENV)
    expect(res.status).toBe(401)
  })
})

describe('requireRole', () => {
  it('403s a USER hitting an ADMIN route', async () => {
    const { app } = buildApp({ role: 'USER' })
    const res = await app.fetch(request('/api/stub-admin/metrics'), DUMMY_ENV)
    expect(res.status).toBe(403)
  })

  it('403s an EDITOR hitting an ADMIN route', async () => {
    const { app } = buildApp({ role: 'EDITOR' })
    const res = await app.fetch(request('/api/stub-admin/metrics'), DUMMY_ENV)
    expect(res.status).toBe(403)
  })

  it('allows an ADMIN through', async () => {
    const { app } = buildApp({ role: 'ADMIN' })
    const res = await app.fetch(request('/api/stub-admin/metrics'), DUMMY_ENV)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ role: 'ADMIN' })
  })
})
