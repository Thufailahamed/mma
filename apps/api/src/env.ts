import type { RateLimiterBinding } from '@mma/realtime/middleware'
import type { UserRole } from '@mma/db/schema'

export interface Env extends RateLimiterBinding {
  DB: D1Database
  MEDIA: R2Bucket
  SESSION_SECRET: string
  ENVIRONMENT: 'development' | 'staging' | 'production'
}

export interface SessionUser {
  id: string
  email: string
  username: string
  displayName: string
  role: UserRole
  sessionId: string
}
