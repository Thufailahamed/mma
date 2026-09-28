import { sql } from 'drizzle-orm'
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { COMMENT_STATUSES } from './enums'
import { events } from './mma'
import { predictions } from './engagement'
import { users } from './identity'

const createdAt = integer('created_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

export const follows = sqliteTable(
  'follows',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    createdAt,
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.targetType, t.targetId] }),
    index('follows_target_idx').on(t.targetType, t.targetId),
    check('follows_target_type_check', sql`${t.targetType} IN ('FIGHTER','EVENT')`),
  ],
)

export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    parentId: text('parent_id'),
    body: text('body').notNull(),
    status: text('status', { enum: COMMENT_STATUSES }).notNull().default('VISIBLE'),
    createdAt,
  },
  (t) => [
    index('comments_entity_idx').on(t.entityType, t.entityId),
    index('comments_user_idx').on(t.userId),
    index('comments_parent_idx').on(t.parentId),
    check(
      'comments_entity_type_check',
      sql`${t.entityType} IN ('ARTICLE','FIGHT','EVENT','PREDICTION')`,
    ),
    check(
      'comments_status_check',
      sql`${t.status} IN ('VISIBLE','PENDING','HIDDEN','DELETED')`,
    ),
    check('comments_body_not_blank', sql`length(trim(${t.body})) > 0`),
  ],
)

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    payload: text('payload'),
    // readAt IS NULL is the unread predicate.
    readAt: integer('read_at', { mode: 'timestamp_ms' }),
    createdAt,
  },
  (t) => [
    index('notifications_user_unread_idx').on(t.userId, t.readAt),
    index('notifications_user_created_idx').on(t.userId, t.createdAt),
  ],
)

export const battles = sqliteTable(
  'battles',
  {
    id: text('id').primaryKey(),
    hostId: text('host_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    guestId: text('guest_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    hostScore: integer('host_score').notNull().default(0),
    guestScore: integer('guest_score').notNull().default(0),
    createdAt,
  },
  (t) => [
    index('battles_host_idx').on(t.hostId),
    index('battles_guest_idx').on(t.guestId),
    index('battles_event_idx').on(t.eventId),
    check('battles_distinct_users', sql`${t.hostId} <> ${t.guestId}`),
    check('battles_scores_non_negative', sql`${t.hostScore} >= 0 AND ${t.guestScore} >= 0`),
  ],
)

export const battlePredictions = sqliteTable(
  'battle_predictions',
  {
    battleId: text('battle_id')
      .notNull()
      .references((): AnySQLiteColumn => battles.id, { onDelete: 'cascade' }),
    predictionId: text('prediction_id')
      .notNull()
      .references(() => predictions.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.battleId, t.predictionId] }),
    index('battle_predictions_prediction_idx').on(t.predictionId),
  ],
)

export const predictionReactions = sqliteTable(
  'prediction_reactions',
  {
    predictionId: text('prediction_id')
      .notNull()
      .references(() => predictions.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull().default('UPVOTE'),
    createdAt,
  },
  (t) => [
    primaryKey({ columns: [t.predictionId, t.userId, t.kind] }),
    index('prediction_reactions_user_idx').on(t.userId),
    check(
      'prediction_reactions_kind_check',
      sql`${t.kind} IN ('UPVOTE','DOWNVOTE','INSIGHTFUL')`,
    ),
  ],
)
