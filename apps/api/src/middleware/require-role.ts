import type { UserRole } from '@mma/db/schema'
import { AppError } from '@mma/shared'
import type { AppMiddleware } from './types'

const RANK: Record<UserRole, number> = { USER: 0, EDITOR: 1, ADMIN: 2 }

/**
 * Gates a capability for a whole route tree. A user with the wrong role gets
 * 403 rather than 404, so the surface stays visible in logs and auditable.
 */
export function requireRole(required: UserRole): AppMiddleware {
  return async (c, next) => {
    const user = c.get('user')
    if (user === undefined) throw AppError.unauthenticated()
    if (RANK[user.role] < RANK[required]) {
      throw AppError.forbidden(`This action requires the ${required} role.`)
    }
    await next()
  }
}
