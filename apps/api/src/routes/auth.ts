import type { Env, SessionUser } from '../env'
import { fail, ok } from '../errors'
import { requireAuth } from '../middleware/require-auth'
import { buildAuthService } from '../services/auth-service'
import {
  createSession,
  revokeSession,
  setCsrfCookie,
  setSessionCookie,
} from '../services/session-service'
import { createDb } from '@mma/db'
import { createSessionsRepo, createUsersRepo } from '@mma/db/repositories'
import { Hono } from 'hono'
import { AppError } from '@mma/shared'
import { loginSchema, registerSchema, toFieldIssues } from '@mma/validation'

type AuthEnv = { Bindings: Env; Variables: { user: SessionUser; requestId: string } }

/** Never leak passwordHash, xp, or sessionId to the client. */
function publicShape(user: SessionUser) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  }
}

/**
 * Hono only merges headers set before the handler returns when the handler
 * uses c.json()/c.text(). These handlers return a raw Response from ok(), so
 * the cookies are attached to that Response directly.
 */
function withSessionCookies(
  response: Response,
  token: string,
  csrfToken: string,
  expiresAt: Date,
): Response {
  response.headers.append('Set-Cookie', setSessionCookie(token, expiresAt))
  response.headers.append('Set-Cookie', setCsrfCookie(csrfToken, expiresAt))
  return response
}

function clearingSessionCookies(response: Response): Response {
  const expired = new Date(0)
  response.headers.append('Set-Cookie', setSessionCookie('', expired))
  response.headers.append('Set-Cookie', setCsrfCookie('', expired))
  return response
}

export function createAuthRoutes() {
  const routes = new Hono<AuthEnv>()

  routes.post('/register', async (c) => {
    const parsed = registerSchema.safeParse(await c.req.json())
    if (!parsed.success) {
      return fail(
        AppError.validation('Request body failed validation.', toFieldIssues(parsed.error)),
        c.get('requestId'),
      )
    }

    const db = createDb(c.env)
    const users = createUsersRepo(db)
    const auth = buildAuthService({ users, sessions: createSessionsRepo(db), xp: users })

    const created = await auth.register(parsed.data)
    const { token, csrfToken, expiresAt } = await createSession(db, created.id, {
      userAgent: c.req.header('user-agent') ?? undefined,
      ip: c.req.header('cf-connecting-ip') ?? undefined,
    })

    return withSessionCookies(
      ok(publicShape({ ...created, sessionId: '' }), 201),
      token,
      csrfToken,
      expiresAt,
    )
  })

  routes.post('/login', async (c) => {
    const parsed = loginSchema.safeParse(await c.req.json())
    if (!parsed.success) {
      return fail(
        AppError.validation('Request body failed validation.', toFieldIssues(parsed.error)),
        c.get('requestId'),
      )
    }

    const db = createDb(c.env)
    const users = createUsersRepo(db)
    const auth = buildAuthService({ users, sessions: createSessionsRepo(db), xp: users })

    const user = await auth.login(parsed.data)
    const { token, csrfToken, expiresAt } = await createSession(db, user.id, {
      userAgent: c.req.header('user-agent') ?? undefined,
      ip: c.req.header('cf-connecting-ip') ?? undefined,
    })

    return withSessionCookies(
      ok(publicShape({ ...user, sessionId: '' })),
      token,
      csrfToken,
      expiresAt,
    )
  })

  routes.post('/logout', requireAuth, async (c) => {
    await revokeSession(createDb(c.env), c.get('user').sessionId)
    return clearingSessionCookies(ok({ signedOut: true }))
  })

  routes.get('/me', requireAuth, async (c) => {
    const user = c.get('user')
    const profile = await createUsersRepo(createDb(c.env)).findProfile(user.id)
    return ok({ ...publicShape(user), profile: profile ?? null })
  })

  return routes
}
