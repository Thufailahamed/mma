import { ratelimit } from '@mma/realtime/middleware'
import type { Context } from 'hono'
import { readCookie } from './cookies'
import { SESSION_COOKIE } from '../services/session-service'
import type { Env } from '../env'

const ANONYMOUS_LIMIT = 60
const AUTHED_LIMIT = 300
const WINDOW_MS = 60_000

type AppContext = Context<{ Bindings: Env }>

function clientKey(c: AppContext): string {
  return `ip:${c.req.header('cf-connecting-ip') ?? 'unknown'}`
}

/** Applied globally, before authentication, keyed by IP. */
export const anonymousRateLimit = ratelimit<Env>({
  limit: ANONYMOUS_LIMIT,
  windowMs: WINDOW_MS,
  key: clientKey,
})

/**
 * Keyed by session where one exists, falling back to IP. Only the opaque
 * token prefix is used, so the limiter never handles the full secret.
 */
export const authedRateLimit = ratelimit<Env>({
  limit: AUTHED_LIMIT,
  windowMs: WINDOW_MS,
  key: (c) => {
    const token = readCookie(c.req.raw, SESSION_COOKIE)
    return token === undefined ? clientKey(c) : `session:${token.slice(0, 16)}`
  },
})
