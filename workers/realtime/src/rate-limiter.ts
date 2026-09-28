export interface RateLimitRequestBody {
  key: string
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
  remaining: number
}

/**
 * A fixed-window counter, one per calling key.
 *
 * This must be a Durable Object rather than an in-memory Map: Worker isolates
 * do not share memory, so an in-process limiter is a no-op the moment the
 * platform scales out.
 */
export class RateLimiter {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const body: RateLimitRequestBody = await request.json()
    const now = Date.now()

    const stored = await this.state.storage.get<{ count: number; resetAt: number }>('window')
    const windowIsActive = stored !== undefined && now < stored.resetAt
    const count = (windowIsActive ? stored.count : 0) + 1
    const resetAt = windowIsActive ? stored.resetAt : now + body.windowMs

    await this.state.storage.put('window', { count, resetAt })

    const result: RateLimitResult = {
      allowed: count <= body.limit,
      retryAfterSeconds: Math.max(0, Math.ceil((resetAt - now) / 1000)),
      remaining: Math.max(0, body.limit - count),
    }

    return Response.json(result)
  }
}
