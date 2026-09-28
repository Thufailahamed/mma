import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { TRIVIA_DIFFICULTIES } from './enums'
import { users } from './identity'

const createdAt = integer('created_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

export const triviaCategories = sqliteTable(
  'trivia_categories',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
  },
  (t) => [uniqueIndex('trivia_categories_slug_unique').on(t.slug)],
)

export const triviaQuestions = sqliteTable(
  'trivia_questions',
  {
    id: text('id').primaryKey(),
    categoryId: text('category_id')
      .notNull()
      .references(() => triviaCategories.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    difficulty: text('difficulty', { enum: TRIVIA_DIFFICULTIES }).notNull().default('MEDIUM'),
    explanation: text('explanation'),
    points: integer('points').notNull().default(10),
    imageUrl: text('image_url'),
    createdAt,
  },
  (t) => [
    index('trivia_questions_category_idx').on(t.categoryId),
    index('trivia_questions_difficulty_idx').on(t.difficulty),
    check(
      'trivia_questions_difficulty_check',
      sql`${t.difficulty} IN ('EASY','MEDIUM','HARD','EXPERT')`,
    ),
    check('trivia_questions_points_positive', sql`${t.points} > 0`),
  ],
)

export const triviaAnswers = sqliteTable(
  'trivia_answers',
  {
    id: text('id').primaryKey(),
    questionId: text('question_id')
      .notNull()
      .references(() => triviaQuestions.id, { onDelete: 'cascade' }),
    answer: text('answer').notNull(),
    isCorrect: integer('is_correct', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [
    index('trivia_answers_question_idx').on(t.questionId),
    check('trivia_answers_is_correct_0_1', sql`${t.isCorrect} IN (0,1)`),
  ],
)

export const triviaAttempts = sqliteTable(
  'trivia_attempts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => triviaQuestions.id, { onDelete: 'cascade' }),
    selectedAnswerId: text('selected_answer_id')
      .notNull()
      .references(() => triviaAnswers.id, { onDelete: 'restrict' }),
    isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
    pointsEarned: integer('points_earned').notNull().default(0),
    responseTimeMs: integer('response_time_ms'),
    createdAt,
  },
  (t) => [
    index('trivia_attempts_user_created_idx').on(t.userId, t.createdAt),
    index('trivia_attempts_question_idx').on(t.questionId),
    check(
      'trivia_attempts_response_time_range',
      sql`${t.responseTimeMs} IS NULL OR ${t.responseTimeMs} BETWEEN 0 AND 600000`,
    ),
    check('trivia_attempts_points_non_negative', sql`${t.pointsEarned} >= 0`),
  ],
)

export const triviaDailySchedules = sqliteTable(
  'trivia_daily_schedules',
  {
    id: text('id').primaryKey(),
    questionId: text('question_id')
      .notNull()
      .references(() => triviaQuestions.id, { onDelete: 'cascade' }),
    scheduledDate: text('scheduled_date').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [
    uniqueIndex('trivia_daily_question_date_unique').on(t.questionId, t.scheduledDate),
    index('trivia_daily_date_order_idx').on(t.scheduledDate, t.sortOrder),
    check(
      'trivia_daily_date_format',
      sql`${t.scheduledDate} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
  ],
)
