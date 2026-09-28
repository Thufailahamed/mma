import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { USER_ROLES } from './enums'

const createdAt = integer('created_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

const updatedAt = integer('updated_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    username: text('username').notNull(),
    displayName: text('display_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    avatarUrl: text('avatar_url'),
    role: text('role', { enum: USER_ROLES }).notNull().default('USER'),
    xp: integer('xp').notNull().default(0),
    level: integer('level').notNull().default(1),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('users_email_unique').on(t.email),
    uniqueIndex('users_username_unique').on(t.username),
    check('users_role_check', sql`${t.role} IN ('USER','EDITOR','ADMIN')`),
    check('users_xp_non_negative', sql`${t.xp} >= 0`),
    check('users_level_positive', sql`${t.level} >= 1`),
  ],
)

export const userProfiles = sqliteTable(
  'user_profiles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bio: text('bio'),
    country: text('country'),
    favoriteFighterId: text('favorite_fighter_id'),
    predictionAccuracy: integer('prediction_accuracy').notNull().default(0),
    totalPredictions: integer('total_predictions').notNull().default(0),
    correctPredictions: integer('correct_predictions').notNull().default(0),
    triviaXp: integer('trivia_xp').notNull().default(0),
    predictionPoints: integer('prediction_points').notNull().default(0),
    currentStreak: integer('current_streak').notNull().default(0),
    longestStreak: integer('longest_streak').notNull().default(0),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('user_profiles_user_unique').on(t.userId),
    index('user_profiles_favorite_fighter_idx').on(t.favoriteFighterId),
    check('user_profiles_accuracy_range', sql`${t.predictionAccuracy} BETWEEN 0 AND 100`),
    check(
      'user_profiles_correct_le_total',
      sql`${t.correctPredictions} <= ${t.totalPredictions}`,
    ),
  ],
)

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    userAgent: text('user_agent'),
    ip: text('ip'),
    createdAt,
  },
  (t) => [
    uniqueIndex('sessions_token_hash_unique').on(t.tokenHash),
    index('sessions_user_idx').on(t.userId),
    index('sessions_expires_at_idx').on(t.expiresAt),
  ],
)

export const xpEvents = sqliteTable(
  'xp_events',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    source: text('source').notNull(),
    amount: integer('amount').notNull(),
    referenceId: text('reference_id'),
    createdAt,
  },
  (t) => [
    index('xp_events_user_created_idx').on(t.userId, t.createdAt),
    index('xp_events_source_idx').on(t.source),
  ],
)

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    metadata: text('metadata'),
    createdAt,
  },
  (t) => [
    index('audit_logs_actor_idx').on(t.actorId),
    index('audit_logs_entity_idx').on(t.entityType, t.entityId),
    index('audit_logs_created_at_idx').on(t.createdAt),
  ],
)
