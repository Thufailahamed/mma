import { AppError } from '@mma/shared'
import { readCookie } from './cookies'
import { CSRF_COOKIE } from '../services/session-service'
import type { AppMiddleware } from './types'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Double-submit token check: the cookie must be present and the header must
 * match it exactly.
 *
 * SameSite=Lax already blocks cross-site POSTs, but the auth layer should not
 * depend on a browser default for its safety, so the second check stays.
 */
export const csrf: AppMiddleware = async (c, next) => {
  if (SAFE_METHODS.has(c.req.method)) {
    await next()
    return
  }

  const cookie = readCookie(c.req.raw, CSRF_COOKIE)
  const header = c.req.header('x-csrf-token')

  if (cookie === undefined || header === undefined || cookie !== header) {
    throw new AppError('CSRF_TOKEN_INVALID', 403, 'CSRF token missing or invalid.')
  }

  await next()
}
