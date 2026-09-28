import { AppError, levelForXp } from '@mma/shared'
import { describe, expect, it, vi } from 'vitest'
import { buildAuthService } from '../src/services/auth-service'
import { SESSION_TTL_MS, cookieOptions, csrfCookieOptions } from '../src/services/session-service'
import { hashPassword } from '../src/crypto/password'

interface StubUser {
  id: string
  email: string
  username: string
  displayName: string
  passwordHash: string
  avatarUrl: string | null
  role: 'USER' | 'EDITOR' | 'ADMIN'
  xp: number
  level: number
  createdAt: Date
  updatedAt: Date
}

const VALID = {
  email: 'fighter@example.com',
  username: 'fighter',
  displayName: 'A Fighter',
  password: 'a-long-enough-password',
}

function createHarness() {
  const rows = new Map<string, StubUser>()
  const users = {
    findByEmail: vi.fn(async (email: string) => {
      for (const row of rows.values()) if (row.email === email) return row
      return undefined
    }),
    findByUsername: vi.fn(async (username: string) => {
      for (const row of rows.values()) if (row.username === username) return row
      return undefined
    }),
    findById: vi.fn(async (id: string) => rows.get(id)),
    insertUser: vi.fn(async (row: Omit<StubUser, 'xp' | 'level' | 'avatarUrl' | 'createdAt' | 'updatedAt'>) => {
      const created: StubUser = {
        ...row,
        avatarUrl: null,
        xp: 0,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      rows.set(row.id, created)
      return created
    }),
    findProfile: vi.fn(async () => undefined),
    updatePasswordHash: vi.fn(async (id: string, passwordHash: string) => {
      const row = rows.get(id)
      if (row !== undefined) row.passwordHash = passwordHash
    }),
    addXpEvent: vi.fn(async () => undefined),
    incrementXp: vi.fn(async (_id: string, amount: number, level: number) => {
      for (const row of rows.values()) {
        row.xp += amount
        row.level = level
      }
    }),
  }
  const sessions = {
    insert: vi.fn(async () => undefined),
    findByTokenHash: vi.fn(async () => undefined),
    deleteById: vi.fn(async () => undefined),
    deleteExpired: vi.fn(async () => undefined),
    touchExpiry: vi.fn(async () => undefined),
  }

  const auth = buildAuthService({ users, sessions, xp: users })
  return { auth, users, sessions, rows }
}

describe('authService.register', () => {
  it('creates a USER with a hashed password and never stores the plaintext', async () => {
    const { auth, rows } = createHarness()
    const user = await auth.register(VALID)

    expect(user.role).toBe('USER')
    const stored = rows.get(user.id)!
    expect(stored.passwordHash).toMatch(/^pbkdf2_sha256\$310000\$/)
    expect(stored.passwordHash).not.toContain(VALID.password)
  })

  it('awards registration XP and records it in the ledger', async () => {
    const { auth, users, rows } = createHarness()
    const user = await auth.register(VALID)

    expect(users.addXpEvent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id, source: 'registration', amount: 50 }),
    )
    expect(rows.get(user.id)!.xp).toBe(50)
    expect(rows.get(user.id)!.level).toBe(levelForXp(50))
  })

  it('rejects a duplicate email with a 409', async () => {
    const { auth } = createHarness()
    await auth.register(VALID)
    await expect(auth.register({ ...VALID, username: 'other' })).rejects.toMatchObject({
      status: 409,
    })
  })

  it('rejects a duplicate username with a 409', async () => {
    const { auth } = createHarness()
    await auth.register(VALID)
    await expect(auth.register({ ...VALID, email: 'other@example.com' })).rejects.toMatchObject({
      status: 409,
    })
  })
})

describe('authService.login', () => {
  it('returns the user for correct credentials', async () => {
    const { auth } = createHarness()
    const registered = await auth.register(VALID)
    const result = await auth.login({ email: VALID.email, password: VALID.password })
    expect(result.id).toBe(registered.id)
    expect(result.role).toBe('USER')
  })

  it('gives an identical 401 for a wrong password and an unknown email', async () => {
    const { auth } = createHarness()
    await auth.register(VALID)

    const wrongPassword = await auth
      .login({ email: VALID.email, password: 'definitely-not-it' })
      .catch((error: unknown) => error)
    const unknownEmail = await auth
      .login({ email: 'nobody@example.com', password: VALID.password })
      .catch((error: unknown) => error)

    expect(wrongPassword).toBeInstanceOf(AppError)
    expect(unknownEmail).toBeInstanceOf(AppError)
    expect((wrongPassword as AppError).message).toBe((unknownEmail as AppError).message)
    expect((wrongPassword as AppError).status).toBe(401)
    expect((unknownEmail as AppError).status).toBe(401)
  })

  it('re-hashes on login when the stored hash is below the current cost', async () => {
    const { auth, users, rows } = createHarness()
    const registered = await auth.register(VALID)
    // Simulate a legacy hash.
    rows.get(registered.id)!.passwordHash = await hashPassword(VALID.password, 1_000)

    await auth.login({ email: VALID.email, password: VALID.password })

    expect(users.updatePasswordHash).toHaveBeenCalled()
    expect(rows.get(registered.id)!.passwordHash).toContain('$310000$')
  })

  it('leaves a current hash untouched on login', async () => {
    const { auth, users } = createHarness()
    await auth.register(VALID)
    await auth.login({ email: VALID.email, password: VALID.password })
    expect(users.updatePasswordHash).not.toHaveBeenCalled()
  })
})

describe('session cookies', () => {
  it('sets HttpOnly, Secure, SameSite=Lax, and a 30-day expiry', () => {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
    const serialized = cookieOptions(expiresAt)
    expect(serialized).toContain('HttpOnly')
    expect(serialized).toContain('Secure')
    expect(serialized).toContain('SameSite=Lax')
    expect(serialized).toContain('Path=/')
    expect(SESSION_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000)
  })

  it('omits HttpOnly from the CSRF cookie so the client can echo it', () => {
    const serialized = csrfCookieOptions(new Date(Date.now() + SESSION_TTL_MS))
    expect(serialized).not.toContain('HttpOnly')
    expect(serialized).toContain('Secure')
    expect(serialized).toContain('SameSite=Lax')
  })
})
