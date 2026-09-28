import type { RateLimiterBinding } from '@mma/realtime/middleware'
import type { UserRole } from '@mma/db/schema'

export interface Env extends RateLimiterBinding {
  DB: D1Database
  MEDIA: R2Bucket
  ENVIRONMENT: 'development' | 'staging' | 'production'
  /** Optional overrides; parsed per request so they need no redeploy. */
  RATE_LIMIT_ANONYMOUS?: string
  RATE_LIMIT_AUTHED?: string
}

/**
 * There is deliberately no SESSION_SECRET binding. Session tokens are 32
 * random bytes, and only their SHA-256 digest is stored, so a digest of a
 * high-entropy value is not brute-forceable and an HMAC key would add no
 * security. A secret that is never read is worse than no secret: it looks
 * like a control that does not exist.
 */
export interface SessionUser {
  id: string
  email: string
  username: string
  displayName: string
  role: UserRole
  sessionId: string
}
