import { createUsersRepo } from '@mma/db/repositories'
import type { Db } from '@mma/db'
import type { Env, SessionUser } from '../env'
import { base64UrlEncode, timingSafeEqual } from '../crypto/encoding'
import { generateSessionToken, hashToken } from '../crypto/token'
import { createSessionsRepo } from '@mma/db/repositories'

export const SESSION_COOKIE = 'mma_session'
export const CSRF_COOKIE = 'mma_csrf'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface SessionMeta {
  userAgent?: string
  ip?: string
}

function base(id: string, value: string, expiresAt: Date): string {
  return [`${id}=${value}`, 'Path=/', 'Secure', 'SameSite=Lax', `Expires=${expiresAt.toUTCString()}`].join('; ')
}

/** The session cookie is HttpOnly so script cannot read the token. */
export function cookieOptions(expiresAt: Date): string {
  return ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', `Expires=${expiresAt.toUTCString()}`].join(
    '; ',
  )
}

/**
 * The CSRF cookie must be readable by the client, because the browser has to
 * echo it back in the X-CSRF-Token header. HttpOnly is deliberately absent.
 */
export function csrfCookieOptions(expiresAt: Date): string {
  return ['Path=/', 'Secure', 'SameSite=Lax', `Expires=${expiresAt.toUTCString()}`].join('; ')
}

export async function createSession(
  db: Db,
  userId: string,
  meta: SessionMeta = {},
): Promise<{ token: string; csrfToken: string; expiresAt: Date }> {
  const token = generateSessionToken()
  const csrfToken = base64UrlEncode(crypto.getRandomValues(new Uint8Array(24)))
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await createSessionsRepo(db).insert({
    id: crypto.randomUUID(),
    userId,
    tokenHash: await hashToken(token),
    expiresAt,
    ...meta,
  })

  return { token, csrfToken, expiresAt }
}

export async function resolveSession(db: Db, token: string): Promise<SessionUser | null> {
  const sessions = createSessionsRepo(db)
  const row = await sessions.findByTokenHash(await hashToken(token))

  if (row === undefined) return null
  if (row.expiresAt.getTime() <= Date.now()) {
    await sessions.deleteById(row.id)
    return null
  }

  const user = await createUsersRepo(db).findById(row.userId)
  if (user === undefined) {
    await sessions.deleteById(row.id)
    return null
  }

  // Sliding expiry: an active session stays alive.
  await sessions.touchExpiry(row.id, new Date(Date.now() + SESSION_TTL_MS))

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    sessionId: row.id,
  }
}

export async function revokeSession(db: Db, sessionId: string): Promise<void> {
  await createSessionsRepo(db).deleteById(sessionId)
}

export function setSessionCookie(token: string, expiresAt: Date): string {
  return base(SESSION_COOKIE, token, expiresAt)
}

export function setCsrfCookie(token: string, expiresAt: Date): string {
  return base(CSRF_COOKIE, token, expiresAt)
}

export function cookiesEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a)
  const right = new TextEncoder().encode(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export type { Env }
