import { getTableName, isTable } from 'drizzle-orm'
import type { Table } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import * as schema from '@mma/db/schema'

const EXPECTED_TABLES = [
  'users',
  'user_profiles',
  'sessions',
  'xp_events',
  'audit_logs',
  'promotions',
  'divisions',
  'fighters',
  'events',
  'fights',
  'fight_rounds',
  'fight_statistics',
  'judge_scores',
  'rankings',
]

function findTable(name: string) {
  return Object.values(schema).find((value) => isTable(value) && getTableName(value) === name)
}

describe('d1 schema — identity and MMA domain', () => {
  it.each(EXPECTED_TABLES)('exports the %s table', (name) => {
    expect(findTable(name), `table "${name}" is not exported from @mma/db/schema`).toBeDefined()
  })
})

const ENGAGEMENT_TABLES = [
  'articles',
  'tags',
  'article_tags',
  'article_fighters',
  'article_events',
  'article_fights',
  'article_revisions',
  'predictions',
  'live_round_scores',
  'polls',
  'poll_options',
  'poll_votes',
  'live_event_snapshots',
]

describe('d1 schema — editorial and engagement', () => {
  it.each(ENGAGEMENT_TABLES)('exports the %s table', (name) => {
    expect(findTable(name), `table "${name}" is not exported from @mma/db/schema`).toBeDefined()
  })
})

const PLATFORM_TABLES = [
  'trivia_categories',
  'trivia_questions',
  'trivia_answers',
  'trivia_attempts',
  'trivia_daily_schedules',
  'achievements',
  'user_achievements',
  'follows',
  'comments',
  'notifications',
  'battles',
  'battle_predictions',
  'prediction_reactions',
  'media_assets',
  'reports',
]

describe('d1 schema — trivia, gamification, community, platform', () => {
  it.each(PLATFORM_TABLES)('exports the %s table', (name) => {
    expect(findTable(name), `table "${name}" is not exported from @mma/db/schema`).toBeDefined()
  })

  it('defines exactly 42 tables in total', () => {
    const names = Object.values(schema)
      .map((value) => (isTable(value) ? getTableName(value as Table) : null))
      .filter((value): value is string => value !== null)
    expect(new Set(names).size).toBe(42)
  })
})
