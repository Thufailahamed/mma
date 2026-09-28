import { getTableName, isTable } from 'drizzle-orm'
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
