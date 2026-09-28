import type { Context, MiddlewareHandler } from 'hono'
import type { RateLimitResult } from './rate-limiter'

export interface RateLimiterBinding {
  RATE_LIMITER: DurableObjectNamespace
}

export interface RateLimitOptions<E extends RateLimiterBinding> {
  /**
   * Requests allowed per window. A function is resolved per request, so a
   * limit can vary by environment without a redeploy.
   */
  limit: number | ((c: Context<{ Bindings: E }>) => number)
  windowMs: number
  /**
   * Return a stable per-caller key. This runs before authentication, so it must
   * not depend on the resolved session user.
   */
  key: (c: Context<{ Bindings: E }>) => string | Promise<string>
}

export function ratelimit<E extends RateLimiterBinding = RateLimiterBinding>(
  options: RateLimitOptions<E>,
): MiddlewareHandler<{ Bindings: E }> {
  return async (c, next) => {
    const key = await options.key(c)
    const limit = typeof options.limit === 'function' ? options.limit(c) : options.limit
    const id = c.env.RATE_LIMITER.idFromName(fnv1a(key))

    const response = await c.env.RATE_LIMITER.get(id).fetch('https://ratelimiter.internal', {
      method: 'POST',
      body: JSON.stringify({ key, limit, windowMs: options.windowMs }),
    })
    const verdict: RateLimitResult = await response.json()
    c.header('X-RateLimit-Limit', String(limit))
    c.header('X-RateLimit-Remaining', String(verdict.remaining))

    if (!verdict.allowed) {
      c.header('Retry-After', String(verdict.retryAfterSeconds))
      return c.json(
        {
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
        },
        429,
      )
    }

    await next()
  }
}

/** FNV-1a: maps a key string to a stable Durable Object stub name. */
function fnv1a(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}
