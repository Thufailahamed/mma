import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { GENDERS, STANCES } from './enums'

const createdAt = integer('created_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

const updatedAt = integer('updated_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

export const promotions = sqliteTable(
  'promotions',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    logoUrl: text('logo_url'),
    website: text('website'),
    createdAt,
  },
  (t) => [uniqueIndex('promotions_slug_unique').on(t.slug)],
)

export const divisions = sqliteTable(
  'divisions',
  {
    id: text('id').primaryKey(),
    promotionId: text('promotion_id')
      .notNull()
      .references(() => promotions.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    gender: text('gender', { enum: GENDERS }).notNull(),
    weightLimit: integer('weight_limit').notNull(),
    slug: text('slug').notNull(),
  },
  (t) => [
    uniqueIndex('divisions_promotion_slug_unique').on(t.promotionId, t.slug),
    index('divisions_promotion_idx').on(t.promotionId),
    check('divisions_gender_check', sql`${t.gender} IN ('MALE','FEMALE')`),
    check('divisions_weight_limit_positive', sql`${t.weightLimit} > 0`),
  ],
)

export const fighters = sqliteTable(
  'fighters',
  {
    id: text('id').primaryKey(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    fullName: text('full_name').notNull(),
    nickname: text('nickname'),
    slug: text('slug').notNull(),
    country: text('country'),
    dateOfBirth: integer('date_of_birth', { mode: 'timestamp_ms' }),
    heightCm: integer('height_cm'),
    reachCm: integer('reach_cm'),
    stance: text('stance', { enum: STANCES }),
    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),
    draws: integer('draws').notNull().default(0),
    noContests: integer('no_contests').notNull().default(0),
    koWins: integer('ko_wins').notNull().default(0),
    submissionWins: integer('submission_wins').notNull().default(0),
    decisionWins: integer('decision_wins').notNull().default(0),
    imageUrl: text('image_url'),
    bio: text('bio'),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('fighters_slug_unique').on(t.slug),
    index('fighters_full_name_idx').on(t.fullName),
    index('fighters_country_idx').on(t.country),
    check(
      'fighters_stance_check',
      sql`${t.stance} IS NULL OR ${t.stance} IN ('ORTHODOX','SOUTHPAW','SWITCH')`,
    ),
    check(
      'fighters_height_range',
      sql`${t.heightCm} IS NULL OR ${t.heightCm} BETWEEN 100 AND 250`,
    ),
    check(
      'fighters_reach_range',
      sql`${t.reachCm} IS NULL OR ${t.reachCm} BETWEEN 100 AND 250`,
    ),
    check(
      'fighters_record_non_negative',
      sql`${t.wins} >= 0 AND ${t.losses} >= 0 AND ${t.draws} >= 0 AND ${t.noContests} >= 0`,
    ),
  ],
)
