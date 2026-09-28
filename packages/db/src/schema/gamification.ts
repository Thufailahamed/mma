import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { users } from './identity'

const unlockedAt = integer('unlocked_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

export const achievements = sqliteTable(
  'achievements',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description').notNull(),
    icon: text('icon').notNull(),
    xpReward: integer('xp_reward').notNull().default(0),
  },
  (t) => [
    uniqueIndex('achievements_slug_unique').on(t.slug),
    check('achievements_xp_non_negative', sql`${t.xpReward} >= 0`),
  ],
)

export const userAchievements = sqliteTable(
  'user_achievements',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'cascade' }),
    unlockedAt,
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.achievementId] }),
    index('user_achievements_achievement_idx').on(t.achievementId),
  ],
)
