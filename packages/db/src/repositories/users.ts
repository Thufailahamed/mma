import { eq, sql } from 'drizzle-orm'
import type { Db } from '../client'
import { userProfiles, users, xpEvents } from '../schema/identity'

export function createUsersRepo(db: Db) {
  return {
    findByEmail(email: string) {
      return db.select().from(users).where(eq(users.email, email)).get()
    },

    findByUsername(username: string) {
      return db.select().from(users).where(eq(users.username, username)).get()
    },

    findById(id: string) {
      return db.select().from(users).where(eq(users.id, id)).get()
    },

    async insertUser(row: {
      id: string
      email: string
      username: string
      displayName: string
      passwordHash: string
      role: 'USER'
    }) {
      await db.insert(users).values({ ...row, xp: 0, level: 1 })
      await db.insert(userProfiles).values({ id: crypto.randomUUID(), userId: row.id })
      return this.findById(row.id)
    },

    findProfile(userId: string) {
      return db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).get()
    },

    async updatePasswordHash(userId: string, passwordHash: string) {
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, userId))
    },

    async addXpEvent(row: { id: string; userId: string; source: string; amount: number }) {
      await db.insert(xpEvents).values(row)
    },

    /**
     * users.xp is a maintained cache; xp_events is the auditable ledger that
     * totals are recomputed from.
     */
    async incrementXp(userId: string, amount: number, level: number) {
      await db
        .update(users)
        .set({
          xp: sql`${users.xp} + ${amount}`,
          level,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
    },
  }
}

export type UsersRepo = ReturnType<typeof createUsersRepo>
