import { describe, expect, it } from 'vitest'
import { base64Decode } from '../src/crypto/encoding'
import { PBKDF2_ITERATIONS, hashPassword, verifyPassword } from '../src/crypto/password'

/**
 * scripts/seed-admin.mjs derives the seeded admin's hash with node:crypto; the
 * Worker verifies it with WebCrypto. If those two ever diverge, the seeded
 * admin silently cannot log in.
 *
 * This is a known-answer test: the vector below was produced by node:crypto's
 * pbkdf2Sync and is pinned here as a constant, so the check needs no Node
 * import and runs identically inside workerd.
 */
const PASSWORD = 'interop-passphrase-123'
const NODE_VECTOR =
  'pbkdf2_sha256$310000$c2FsdHNhbHRzYWx0c2FsdA==$8PK59ELHWL1Q49HssBIKCIAjY7nHH8VUIMcnvae1d1Y='

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
    // 16-byte salt and 32-byte key, both standard base64 with padding.
    expect(base64Decode(parts[2]!)).toHaveLength(16)
    expect(base64Decode(parts[3]!)).toHaveLength(32)
  })

  it('round-trips a Worker-produced hash', async () => {
    const stored = await hashPassword(PASSWORD)
    await expect(verifyPassword(PASSWORD, stored)).resolves.toBe(true)
  })
})
