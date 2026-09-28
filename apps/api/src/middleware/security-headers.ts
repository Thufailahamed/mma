import type { MiddlewareHandler } from 'hono'
import type { Env } from '../env'

export function securityHeaders(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    await next()
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Frame-Options', 'DENY')
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    c.header(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    )
    if (c.env.ENVIRONMENT !== 'development') {
      c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    }
  }
}
