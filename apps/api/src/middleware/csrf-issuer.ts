import { readCookie } from './cookies'
import { base64UrlEncode } from '../crypto/encoding'
import { CSRF_COOKIE, csrfCookieOptions } from '../services/session-service'
import type { AppMiddleware } from './types'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const ISSUER_TTL_MS = 24 * 60 * 60 * 1000

/**
 * Issues the double-submit token to a browser that does not hold one yet.
 *
 * Without this, a first-time visitor has no CSRF cookie, so their very first
 * POST — registering or logging in — has nothing to echo and would be
 * rejected, making the auth flow unreachable.
 */
export const csrfIssuer: AppMiddleware = async (c, next) => {
  const shouldIssue =
    SAFE_METHODS.has(c.req.method) && readCookie(c.req.raw, CSRF_COOKIE) === undefined

  try {
    await next()
  } finally {
    // Set after the chain: Hono merges headers onto the response only once the
    // handler has produced it, and the finally keeps the token available even
    // when the request is rejected.
    if (shouldIssue) {
      const token = base64UrlEncode(crypto.getRandomValues(new Uint8Array(24)))
      c.header(
        'Set-Cookie',
        `${CSRF_COOKIE}=${token}; ${csrfCookieOptions(new Date(Date.now() + ISSUER_TTL_MS))}`,
        { append: true },
      )
    }
  }
}
