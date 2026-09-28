import { ratelimit } from '@mma/realtime/middleware'
import type { Context } from 'hono'
import { readCookie } from './cookies'
import { SESSION_COOKIE } from '../services/session-service'
import type { Env } from '../env'

const WINDOW_MS = 60_000

/**
 * Anonymous traffic is limited generously in development so a local end-to-end
 * suite, which shares a single IP, is not throttled by its own traffic.
 * Staging and production default to 60/min and enforce it strictly.
 */
const DEV_FLOOR = 10_000
const ANONYMOUS_DEFAULT = 60
const AUTHED_DEFAULT = 300

type AppContext = Context<{ Bindings: Env }>

function limitFor(
  env: Env,
  configured: string | undefined,
  productionDefault: number,
): number {
  if (env.ENVIRONMENT === 'development') return DEV_FLOOR
  const parsed = Number.parseInt(configured ?? '', 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : productionDefault
}

function clientKey(c: AppContext): string {
  return `ip:${c.req.header('cf-connecting-ip') ?? 'unknown'}`
}

export const anonymousRateLimit = ratelimit<Env>({
  limit: (c) => limitFor(c.env, c.env.RATE_LIMIT_ANONYMOUS, ANONYMOUS_DEFAULT),
  windowMs: WINDOW_MS,
  key: clientKey,
})

/**
 * Keyed by session where one exists, falling back to IP. Only the opaque token
 * prefix is used, so the limiter never handles the full secret.
 */
export const authedRateLimit = ratelimit<Env>({
  limit: (c) => limitFor(c.env, c.env.RATE_LIMIT_AUTHED, AUTHED_DEFAULT),
  windowMs: WINDOW_MS,
  key: (c) => {
    const token = readCookie(c.req.raw, SESSION_COOKIE)
    return token === undefined ? clientKey(c) : `session:${token.slice(0, 16)}`
  },
})
