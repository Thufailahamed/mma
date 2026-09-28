import { eq, lt } from 'drizzle-orm'
import type { Db } from '../client'
import { sessions } from '../schema/identity'

export function createSessionsRepo(db: Db) {
  return {
    async insert(row: {
      id: string
      userId: string
      tokenHash: string
      expiresAt: Date
      userAgent?: string
      ip?: string
    }) {
      await db.insert(sessions).values(row)
    },

    findByTokenHash(tokenHash: string) {
      return db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).get()
    },

    async deleteById(id: string) {
      await db.delete(sessions).where(eq(sessions.id, id))
    },

    async deleteExpired(now: Date) {
      await db.delete(sessions).where(lt(sessions.expiresAt, now))
    },

    /** Sliding expiry: refreshed on every authenticated request. */
    async touchExpiry(id: string, expiresAt: Date) {
      await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id))
    },
  }
}

export type SessionsRepo = ReturnType<typeof createSessionsRepo>
