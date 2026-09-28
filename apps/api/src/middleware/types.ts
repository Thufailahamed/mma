import type { MiddlewareHandler } from 'hono'
import type { Env, SessionUser } from '../env'

export type AppEnv = {
  Bindings: Env
  Variables: { user: SessionUser; requestId: string }
}

/**
 * The shared middleware type. Every middleware throws an AppError and lets the
 * app-level onError serialise it, so no middleware formats a response itself.
 */
export type AppMiddleware = MiddlewareHandler<AppEnv>
