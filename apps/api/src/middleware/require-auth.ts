import { createDb } from '@mma/db'
import { AppError } from '@mma/shared'
import { readCookie } from './cookies'
import { SESSION_COOKIE, resolveSession } from '../services/session-service'
import type { AppMiddleware } from './types'

export const requireAuth: AppMiddleware = async (c, next) => {
  const token = readCookie(c.req.raw, SESSION_COOKIE)
  if (token === undefined) throw AppError.unauthenticated()

  const user = await resolveSession(createDb(c.env), token)
  if (user === null) throw AppError.unauthenticated()

  c.set('user', user)
  await next()
}
