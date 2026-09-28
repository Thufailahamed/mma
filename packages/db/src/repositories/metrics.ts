import { eq, sql } from 'drizzle-orm'
import type { Db } from '../client'
import { articles } from '../schema/editorial'
import { users } from '../schema/identity'
import { events } from '../schema/mma'
import { triviaAttempts } from '../schema/trivia'

/** Each metric is its own query so a new dashboard tile cannot widen the others. */
export function createMetricsRepo(db: Db) {
  return {
    async userCount() {
      const row = await db.select({ value: sql<number>`count(*)` }).from(users).get()
      return row?.value ?? 0
    },

    async articleCount() {
      const row = await db.select({ value: sql<number>`count(*)` }).from(articles).get()
      return row?.value ?? 0
    },

    async upcomingEventCount() {
      const row = await db
        .select({ value: sql<number>`count(*)` })
        .from(events)
        .where(eq(events.status, 'UPCOMING'))
        .get()
      return row?.value ?? 0
    },

    async liveEventCount() {
      const row = await db
        .select({ value: sql<number>`count(*)` })
        .from(events)
        .where(eq(events.status, 'LIVE'))
        .get()
      return row?.value ?? 0
    },

    async triviaAttemptCount() {
      const row = await db.select({ value: sql<number>`count(*)` }).from(triviaAttempts).get()
      return row?.value ?? 0
    },

    async activeUserCount(since: Date) {
      const row = await db
        .select({ value: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.createdAt} >= ${since.getTime()}`)
        .get()
      return row?.value ?? 0
    },
  }
}

export type MetricsRepo = ReturnType<typeof createMetricsRepo>
