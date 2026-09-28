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
import { POLL_STATUSES } from './enums'
import { events, fights } from './mma'
import { fighters } from './reference'
import { users } from './identity'

const createdAt = integer('created_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

const submittedAt = integer('submitted_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

export const predictions = sqliteTable(
  'predictions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fightId: text('fight_id')
      .notNull()
      .references(() => fights.id, { onDelete: 'cascade' }),
    predictedWinnerId: text('predicted_winner_id')
      .notNull()
      .references(() => fighters.id, { onDelete: 'cascade' }),
    predictedMethod: text('predicted_method').notNull(),
    predictedRound: integer('predicted_round'),
    bonusAnswers: text('bonus_answers'),
    // Stamped at write time so historical rows are never re-scored with a
    // later rule set.
    scoringVersion: text('scoring_version').notNull(),
    pointsEarned: integer('points_earned').notNull().default(0),
    isCorrect: integer('is_correct', { mode: 'boolean' }),
    submittedAt,
    resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
  },
  (t) => [
    uniqueIndex('predictions_user_fight_unique').on(t.userId, t.fightId),
    index('predictions_fight_idx').on(t.fightId),
    index('predictions_user_submitted_idx').on(t.userId, t.submittedAt),
    index('predictions_user_points_idx').on(t.userId, t.pointsEarned),
    check(
      'predictions_round_valid',
      sql`${t.predictedRound} IS NULL OR ${t.predictedRound} BETWEEN 1 AND 5`,
    ),
    check('predictions_points_non_negative', sql`${t.pointsEarned} >= 0`),
    check(
      'predictions_resolved_has_correct',
      sql`${t.resolvedAt} IS NULL OR ${t.isCorrect} IS NOT NULL`,
    ),
  ],
)

export const liveRoundScores = sqliteTable(
  'live_round_scores',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fightId: text('fight_id')
      .notNull()
      .references(() => fights.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').notNull(),
    fighterAScore: integer('fighter_a_score').notNull(),
    fighterBScore: integer('fighter_b_score').notNull(),
    submittedAt,
  },
  (t) => [
    uniqueIndex('live_round_scores_user_fight_round_unique').on(
      t.userId,
      t.fightId,
      t.roundNumber,
    ),
    index('live_round_scores_fight_round_idx').on(t.fightId, t.roundNumber),
    check('live_round_scores_number_valid', sql`${t.roundNumber} BETWEEN 1 AND 5`),
    // Only the standard MMA 10-point must scorecard combinations are legal.
    check(
      'live_round_scores_valid_combination',
      sql`(
        (${t.fighterAScore} = 10 AND ${t.fighterBScore} BETWEEN 8 AND 9) OR
        (${t.fighterAScore} BETWEEN 8 AND 9 AND ${t.fighterBScore} = 10) OR
        (${t.fighterAScore} = 10 AND ${t.fighterBScore} = 10) OR
        (${t.fighterAScore} = 9 AND ${t.fighterBScore} = 9) OR
        (${t.fighterAScore} = 10 AND ${t.fighterBScore} = 7) OR
        (${t.fighterAScore} = 7 AND ${t.fighterBScore} = 10)
      )`,
    ),
  ],
)

export const polls = sqliteTable(
  'polls',
  {
    id: text('id').primaryKey(),
    question: text('question').notNull(),
    status: text('status', { enum: POLL_STATUSES }).notNull().default('DRAFT'),
    eventId: text('event_id').references(() => events.id, { onDelete: 'cascade' }),
    fightId: text('fight_id').references(() => fights.id, { onDelete: 'cascade' }),
    opensAt: integer('opens_at', { mode: 'timestamp_ms' }),
    closesAt: integer('closes_at', { mode: 'timestamp_ms' }),
    createdAt,
  },
  (t) => [
    index('polls_event_idx').on(t.eventId),
    index('polls_fight_idx').on(t.fightId),
    index('polls_status_idx').on(t.status),
    check('polls_status_check', sql`${t.status} IN ('DRAFT','OPEN','CLOSED')`),
    check(
      'polls_window_order',
      sql`${t.opensAt} IS NULL OR ${t.closesAt} IS NULL OR ${t.closesAt} > ${t.opensAt}`,
    ),
    // A poll targets exactly one entity, never zero and never two.
    check(
      'polls_exactly_one_target',
      sql`((CASE WHEN ${t.eventId} IS NULL THEN 0 ELSE 1 END) + (CASE WHEN ${t.fightId} IS NULL THEN 0 ELSE 1 END)) = 1`,
    ),
  ],
)

export const pollOptions = sqliteTable(
  'poll_options',
  {
    id: text('id').primaryKey(),
    pollId: text('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [
    uniqueIndex('poll_options_poll_label_unique').on(t.pollId, t.label),
    index('poll_options_poll_idx').on(t.pollId),
  ],
)

export const pollVotes = sqliteTable(
  'poll_votes',
  {
    pollId: text('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    optionId: text('option_id')
      .notNull()
      .references(() => pollOptions.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt,
  },
  (t) => [
    // One vote per user per poll; changing your mind updates the existing row.
    primaryKey({ columns: [t.pollId, t.userId] }),
    index('poll_votes_option_idx').on(t.optionId),
    index('poll_votes_user_idx').on(t.userId),
  ],
)

export const liveEventSnapshots = sqliteTable(
  'live_event_snapshots',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    state: text('state').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    uniqueIndex('live_event_snapshots_event_unique').on(t.eventId),
    index('live_event_snapshots_updated_at_idx').on(t.updatedAt),
  ],
)
