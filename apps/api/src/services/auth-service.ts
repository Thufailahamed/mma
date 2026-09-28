import { AppError, XP_REWARDS, levelForXp } from '@mma/shared'
import type { LoginInput, RegisterInput } from '@mma/validation'
import type { SessionsRepo, UsersRepo } from '@mma/db/repositories'
import type { SessionUser } from '../env'
import { hashPassword, needsRehash, verifyPassword } from '../crypto/password'

/** One message for every failed login, so the API never reveals which field was wrong. */
const INVALID_CREDENTIALS = 'Email or password is incorrect.'

/**
 * A structurally valid hash to derive against when no account exists, so an
 * unknown email and a wrong password take comparable time.
 */
const DUMMY_HASH =
  'pbkdf2_sha256$310000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

export interface AuthDeps {
  users: UsersRepo
  sessions: SessionsRepo
  xp: Pick<UsersRepo, 'addXpEvent' | 'incrementXp'>
}

export function buildAuthService(deps: AuthDeps) {
  return {
    async register(input: RegisterInput): Promise<SessionUser> {
      const [existingEmail, existingUsername] = await Promise.all([
        deps.users.findByEmail(input.email),
        deps.users.findByUsername(input.username),
      ])

      if (existingEmail !== undefined || existingUsername !== undefined) {
        throw new AppError('CONFLICT', 409, 'That email or username is already registered.')
      }

      const id = crypto.randomUUID()
      const row = await deps.users.insertUser({
        id,
        email: input.email,
        username: input.username,
        displayName: input.displayName,
        passwordHash: await hashPassword(input.password),
        role: 'USER',
      })

      if (row === undefined) {
        throw new AppError('INTERNAL_ERROR', 500, 'Could not create the account.')
      }

      await deps.xp.addXpEvent({
        id: crypto.randomUUID(),
        userId: id,
        source: 'registration',
        amount: XP_REWARDS.registration,
      })
      await deps.xp.incrementXp(id, XP_REWARDS.registration, levelForXp(XP_REWARDS.registration))

      return {
        id: row.id,
        email: row.email,
        username: row.username,
        displayName: row.displayName,
        role: row.role,
        sessionId: '',
      }
    },

    async login(input: LoginInput): Promise<SessionUser> {
      const user = await deps.users.findByEmail(input.email)

      if (user === undefined) {
        await verifyPassword(input.password, DUMMY_HASH)
        throw AppError.unauthenticated(INVALID_CREDENTIALS)
      }

      if (!(await verifyPassword(input.password, user.passwordHash))) {
        throw AppError.unauthenticated(INVALID_CREDENTIALS)
      }

      // Upgrade a hash that predates the current iteration count.
      if (needsRehash(user.passwordHash)) {
        await deps.users.updatePasswordHash(user.id, await hashPassword(input.password))
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        sessionId: '',
      }
    },
  }
}

export type AuthService = ReturnType<typeof buildAuthService>
