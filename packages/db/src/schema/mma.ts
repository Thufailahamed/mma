import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { EVENT_STATUSES, FIGHT_METHODS, FIGHT_RESULTS, FIGHT_STATUSES } from './enums'
import { divisions, fighters, promotions } from './reference'

const createdAt = integer('created_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

const updatedAt = integer('updated_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),
    promotionId: text('promotion_id')
      .notNull()
      .references(() => promotions.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    eventDate: integer('event_date', { mode: 'timestamp_ms' }).notNull(),
    venue: text('venue'),
    city: text('city'),
    country: text('country'),
    status: text('status', { enum: EVENT_STATUSES }).notNull().default('UPCOMING'),
    posterUrl: text('poster_url'),
    description: text('description'),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('events_slug_unique').on(t.slug),
    index('events_promotion_idx').on(t.promotionId),
    index('events_date_idx').on(t.eventDate),
    index('events_status_date_idx').on(t.status, t.eventDate),
    check(
      'events_status_check',
      sql`${t.status} IN ('UPCOMING','LIVE','COMPLETED','CANCELLED')`,
    ),
  ],
)

export const fights = sqliteTable(
  'fights',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    fighterAId: text('fighter_a_id')
      .notNull()
      .references(() => fighters.id, { onDelete: 'restrict' }),
    fighterBId: text('fighter_b_id')
      .notNull()
      .references(() => fighters.id, { onDelete: 'restrict' }),
    divisionId: text('division_id')
      .notNull()
      .references(() => divisions.id, { onDelete: 'restrict' }),
    fightOrder: integer('fight_order').notNull(),
    isMainEvent: integer('is_main_event', { mode: 'boolean' }).notNull().default(false),
    isTitleFight: integer('is_title_fight', { mode: 'boolean' }).notNull().default(false),
    scheduledRounds: integer('scheduled_rounds').notNull().default(3),
    status: text('status', { enum: FIGHT_STATUSES }).notNull().default('SCHEDULED'),
    result: text('result', { enum: FIGHT_RESULTS }),
    winnerId: text('winner_id').references(() => fighters.id, { onDelete: 'set null' }),
    method: text('method', { enum: FIGHT_METHODS }),
    finishRound: integer('finish_round'),
    finishTime: text('finish_time'),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('fights_event_order_unique').on(t.eventId, t.fightOrder),
    index('fights_event_idx').on(t.eventId),
    index('fights_fighter_a_idx').on(t.fighterAId),
    index('fights_fighter_b_idx').on(t.fighterBId),
    index('fights_division_idx').on(t.divisionId),
    index('fights_status_idx').on(t.status),
    index('fights_winner_idx').on(t.winnerId),
    check('fights_distinct_fighters', sql`${t.fighterAId} <> ${t.fighterBId}`),
    check(
      'fights_status_check',
      sql`${t.status} IN ('SCHEDULED','LIVE','COMPLETED','CANCELLED')`,
    ),
    check('fights_rounds_valid', sql`${t.scheduledRounds} IN (1,2,3,5)`),
    check(
      'fights_finish_round_valid',
      sql`${t.finishRound} IS NULL OR ${t.finishRound} BETWEEN 1 AND 5`,
    ),
    check(
      'fights_finish_time_format',
      sql`${t.finishTime} IS NULL OR ${t.finishTime} GLOB '[0-9]:[0-5][0-9]'`,
    ),
  ],
)

export const fightRounds = sqliteTable(
  'fight_rounds',
  {
    id: text('id').primaryKey(),
    fightId: text('fight_id')
      .notNull()
      .references(() => fights.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').notNull(),
    durationSeconds: integer('duration_seconds'),
    fighterAScore: integer('fighter_a_score'),
    fighterBScore: integer('fighter_b_score'),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    createdAt,
  },
  (t) => [
    uniqueIndex('fight_rounds_fight_round_unique').on(t.fightId, t.roundNumber),
    index('fight_rounds_fight_idx').on(t.fightId),
    check('fight_rounds_number_valid', sql`${t.roundNumber} BETWEEN 1 AND 5`),
    check(
      'fight_rounds_score_range',
      sql`(${t.fighterAScore} IS NULL OR ${t.fighterAScore} BETWEEN 6 AND 10) AND (${t.fighterBScore} IS NULL OR ${t.fighterBScore} BETWEEN 6 AND 10)`,
    ),
  ],
)

export const fightStatistics = sqliteTable(
  'fight_statistics',
  {
    id: text('id').primaryKey(),
    fightId: text('fight_id')
      .notNull()
      .references(() => fights.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number'),
    fighterId: text('fighter_id')
      .notNull()
      .references(() => fighters.id, { onDelete: 'cascade' }),
    significantStrikes: integer('significant_strikes').notNull().default(0),
    totalStrikes: integer('total_strikes').notNull().default(0),
    headStrikes: integer('head_strikes').notNull().default(0),
    bodyStrikes: integer('body_strikes').notNull().default(0),
    legStrikes: integer('leg_strikes').notNull().default(0),
    takedowns: integer('takedowns').notNull().default(0),
    takedownAttempts: integer('takedown_attempts').notNull().default(0),
    submissionAttempts: integer('submission_attempts').notNull().default(0),
    reversals: integer('reversals').notNull().default(0),
    controlSeconds: integer('control_seconds').notNull().default(0),
    createdAt,
  },
  (t) => [
    uniqueIndex('fight_stats_fight_round_fighter_unique').on(
      t.fightId,
      t.roundNumber,
      t.fighterId,
    ),
    index('fight_stats_fight_idx').on(t.fightId),
    index('fight_stats_fighter_idx').on(t.fighterId),
    check(
      'fight_stats_non_negative',
      sql`${t.significantStrikes} >= 0 AND ${t.totalStrikes} >= 0 AND ${t.takedowns} >= 0 AND ${t.controlSeconds} >= 0`,
    ),
  ],
)

export const judgeScores = sqliteTable(
  'judge_scores',
  {
    id: text('id').primaryKey(),
    fightId: text('fight_id')
      .notNull()
      .references(() => fights.id, { onDelete: 'cascade' }),
    judgeName: text('judge_name').notNull(),
    fighterAScore: integer('fighter_a_score').notNull(),
    fighterBScore: integer('fighter_b_score').notNull(),
    createdAt,
  },
  (t) => [
    uniqueIndex('judge_scores_fight_judge_unique').on(t.fightId, t.judgeName),
    index('judge_scores_fight_idx').on(t.fightId),
    check(
      'judge_scores_range',
      sql`${t.fighterAScore} BETWEEN 6 AND 10 AND ${t.fighterBScore} BETWEEN 6 AND 10`,
    ),
  ],
)
