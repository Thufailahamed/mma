import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { divisions, fighters, promotions } from './reference'

export const rankings = sqliteTable(
  'rankings',
  {
    id: text('id').primaryKey(),
    promotionId: text('promotion_id')
      .notNull()
      .references(() => promotions.id, { onDelete: 'cascade' }),
    divisionId: text('division_id')
      .notNull()
      .references(() => divisions.id, { onDelete: 'cascade' }),
    fighterId: text('fighter_id')
      .notNull()
      .references(() => fighters.id, { onDelete: 'cascade' }),
    rank: integer('rank').notNull().default(0),
    isChampion: integer('is_champion', { mode: 'boolean' }).notNull().default(false),
    rankingDate: integer('ranking_date', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    uniqueIndex('rankings_division_date_fighter_unique').on(
      t.divisionId,
      t.rankingDate,
      t.fighterId,
    ),
    index('rankings_promotion_division_date_idx').on(
      t.promotionId,
      t.divisionId,
      t.rankingDate,
    ),
    index('rankings_fighter_idx').on(t.fighterId),
    check('rankings_rank_valid', sql`${t.rank} >= 0`),
    check(
      'rankings_champion_rank_zero',
      sql`(${t.isChampion} = 1 AND ${t.rank} = 0) OR (${t.isChampion} = 0 AND ${t.rank} >= 1)`,
    ),
  ],
)
