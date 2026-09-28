import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PBKDF2_ITERATIONS, PBKDF2_MAX_ITERATIONS } from '../src/crypto/password'

/**
 * The seed script is a standalone Node program, so it cannot import the
 * Worker's constant. That makes silent drift possible: the script once hardcoded
 * 310,000 while the Worker enforced a 100,000 ceiling, so the seeded admin was
 * written with a hash the Worker could still read but never produce.
 */
const SCRIPT_PATH = resolve(import.meta.dirname, '../../../scripts/seed-admin.mjs')

describe('scripts/seed-admin.mjs', () => {
  const script = readFileSync(SCRIPT_PATH, 'utf8')

  it('uses the same iteration count as the Worker', () => {
    const match = /^const ITERATIONS = ([\d_]+)$/m.exec(script)
    expect(match, 'could not find `const ITERATIONS = <n>` in the seed script').not.toBeNull()
    const value = Number((match?.[1] ?? '0').replaceAll('_', ''))
    expect(value).toBe(PBKDF2_ITERATIONS)
  })

  it('stays at or below the Workers runtime ceiling', () => {
    const match = /^const ITERATIONS = ([\d_]+)$/m.exec(script)
    const value = Number((match?.[1] ?? '0').replaceAll('_', ''))
    expect(value).toBeLessThanOrEqual(PBKDF2_MAX_ITERATIONS)
  })

  it('refuses to run in production', () => {
    expect(script).toMatch(/ENVIRONMENT === 'production'/)
    expect(script).toMatch(/process\.exit\(1\)/)
  })
})
