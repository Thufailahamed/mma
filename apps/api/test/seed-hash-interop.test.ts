import { describe, expect, it } from 'vitest'
import {
  PBKDF2_ITERATIONS,
  PBKDF2_MAX_ITERATIONS,
  hashPassword,
  needsRehash,
  verifyPassword,
} from '../src/crypto/password'

/**
 * scripts/seed-admin.mjs derives the seeded admin's hash with node:crypto;
 * the Worker verifies it with WebCrypto. If those two diverge, the seeded
 * admin silently cannot log in.
 *
 * The vector below was produced by node:crypto's pbkdf2Sync and is pinned as
 * a constant, so this file needs no Node import and runs identically inside
 * workerd. It also keeps the test free of Buffer and node:crypto, whose types
 * are shadowed by @cloudflare/workers-types.
 */
const PASSWORD = 'interop-passphrase-123'
const NODE_VECTOR =
  'pbkdf2_sha256$100000$c2FsdHNhbHRzYWx0c2FsdA==$6TF02H+hxRXOlEQs3hYzncg8IDhCYfG7Tp3jKmSljjY='

/**
 * Cloudflare's WebCrypto rejects PBKDF2 above 100,000 iterations with
 * NotSupportedError. `wrangler dev` does not enforce that ceiling, so a value
 * above it passes every local test and then fails with a 500 only once
 * deployed. These assertions are the guard that would have caught it.
 */
describe('Workers PBKDF2 ceiling', () => {
  it('keeps the iteration count at or below the runtime maximum', () => {
    expect(PBKDF2_ITERATIONS).toBeLessThanOrEqual(PBKDF2_MAX_ITERATIONS)
  })

  it('pins the known-answer vector to the iteration count under test', () => {
    expect(NODE_VECTOR.split('$')[1]).toBe(String(PBKDF2_ITERATIONS))
  })
})

describe('node:crypto and WebCrypto PBKDF2 interoperability', () => {
  it('verifies a hash produced by node:crypto', async () => {
    await expect(verifyPassword(PASSWORD, NODE_VECTOR)).resolves.toBe(true)
  })

  it('rejects a wrong password against a node:crypto hash', async () => {
    await expect(verifyPassword('wrong', NODE_VECTOR)).resolves.toBe(false)
  })

  it('produces a hash in the exact format the seed script writes', async () => {
    const stored = await hashPassword(PASSWORD)
    const parts = stored.split('$')
    expect(parts).toHaveLength(4)
    expect(parts[0]).toBe('pbkdf2_sha256')
    expect(Number(parts[1])).toBe(PBKDF2_ITERATIONS)
  })

  it('round-trips a Worker-produced hash', async () => {
    const stored = await hashPassword(PASSWORD)
    await expect(verifyPassword(PASSWORD, stored)).resolves.toBe(true)
  })
})

describe('needsRehash', () => {
  it('does not flag a hash at the current iteration count', async () => {
    expect(needsRehash(await hashPassword('current'))).toBe(false)
  })

  it('flags a hash written below the current count so login upgrades it', () => {
    const weak = 'pbkdf2_sha256$1000$c2FsdHNhbHRzYWx0c2FsdA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
    expect(needsRehash(weak)).toBe(true)
  })

  it('does not downgrade a hash written at a higher count', () => {
    // A row written before the ceiling was lowered stays valid, because the
    // stored string carries its own parameters.
    const stronger = 'pbkdf2_sha256$310000$c2FsdHNhbHRzYWx0c2FsdA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
    expect(needsRehash(stronger)).toBe(false)
  })
})
