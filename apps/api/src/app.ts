import { Hono } from 'hono'
import { AppError } from '@mma/shared'
import type { Env, SessionUser } from './env'
import { fail, toAppError } from './errors'
import { csrf } from './middleware/csrf'
import { csrfIssuer } from './middleware/csrf-issuer'
import { anonymousRateLimit, authedRateLimit } from './middleware/rate-limit'
import { requireAuth } from './middleware/require-auth'
import { requireRole } from './middleware/require-role'
import { securityHeaders } from './middleware/security-headers'
import { createAdminRoutes } from './routes/admin'
import { createAuthRoutes } from './routes/auth'
import { healthHandler } from './routes/health'
import { createMediaRoutes } from './routes/media'
import { createPromotionRoutes } from './routes/promotions'

type AppEnv = { Bindings: Env; Variables: { user: SessionUser; requestId: string } }

export const app = new Hono<AppEnv>()

// Order matters. The request id must exist before anything can fail, and the
// CSRF issuer must run before enforcement so a first-time browser is issued a
// token before it attempts its first mutating request.
//
// Both set their headers after next() in a finally block: Hono only merges
// headers onto a response created after the middleware chain, and this app's
// handlers return raw Response objects via ok().
app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)
  try {
    await next()
  } finally {
    c.header('X-Request-Id', requestId)
  }
})

app.use('*', securityHeaders)
app.use('*', anonymousRateLimit)
app.use('*', csrfIssuer)

app.onError((cause, c) => {
  const requestId = c.get('requestId') ?? crypto.randomUUID()
  if (!(cause instanceof AppError)) {
    console.error(
      JSON.stringify({
        level: 'error',
        requestId,
        path: c.req.path,
        cause: String(cause),
      }),
    )
  }
  return fail(toAppError(cause), requestId)
})

app.notFound((c) => fail(new AppError('NOT_FOUND', 404, 'No such endpoint.'), c.get('requestId')))

app.get('/api/health', healthHandler)

// Hono applies middleware to a subtree with use(); route() only mounts the sub-app.
app.use('/api/auth/*', csrf)
app.route('/api/auth', createAuthRoutes())
app.route('/api/promotions', createPromotionRoutes())
app.use('/api/admin/*', authedRateLimit, csrf, requireAuth, requireRole('ADMIN'))
app.route('/api/admin', createAdminRoutes())
app.route('/img', createMediaRoutes())

export default app
