import { describe, expect, it } from 'vitest'
import { PBKDF2_ITERATIONS, hashPassword, needsRehash, verifyPassword } from '../src/crypto/password'
import { base64UrlDecode, base64UrlEncode, timingSafeEqual } from '../src/crypto/encoding'
import { generateSessionToken, hashToken } from '../src/crypto/token'

describe('password hashing', () => {
  it('produces the documented format', async () => {
    const stored = await hashPassword('correct horse battery staple')
    const parts = stored.split('$')
    expect(parts).toHaveLength(4)
    expect(parts[0]).toBe('pbkdf2_sha256')
    expect(Number(parts[1])).toBe(PBKDF2_ITERATIONS)
    expect(parts[2]).not.toBe('')
    expect(parts[3]).not.toBe('')
  })

  it('accepts the correct password', async () => {
    const stored = await hashPassword('s3cret-passphrase')
    await expect(verifyPassword('s3cret-passphrase', stored)).resolves.toBe(true)
  })

  it('rejects the wrong password', async () => {
    const stored = await hashPassword('s3cret-passphrase')
    await expect(verifyPassword('s3cret-passphras', stored)).resolves.toBe(false)
    await expect(verifyPassword('', stored)).resolves.toBe(false)
  })

  it('salts each hash independently', async () => {
    const first = await hashPassword('same-password')
    const second = await hashPassword('same-password')
    expect(first).not.toBe(second)
    await expect(verifyPassword('same-password', first)).resolves.toBe(true)
    await expect(verifyPassword('same-password', second)).resolves.toBe(true)
  })

  it('flags a stored hash with too few iterations for rehash', async () => {
    const weak = 'pbkdf2_sha256$1000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
    expect(needsRehash(weak)).toBe(true)
    expect(needsRehash(await hashPassword('fresh'))).toBe(false)
  })

  it('returns false rather than throwing on a malformed stored value', async () => {
    await expect(verifyPassword('anything', 'not-a-hash')).resolves.toBe(false)
    await expect(verifyPassword('anything', 'pbkdf2_sha256$abc$x$y')).resolves.toBe(false)
    await expect(verifyPassword('anything', 'md5$1$x$y')).resolves.toBe(false)
    await expect(verifyPassword('anything', '')).resolves.toBe(false)
  })
})

describe('session tokens', () => {
  it('generates a 43-character base64url token from 32 bytes', () => {
    const token = generateSessionToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(base64UrlDecode(token)).toHaveLength(32)
  })

  it('generates a unique token each call', () => {
    const tokens = new Set(Array.from({ length: 32 }, generateSessionToken))
    expect(tokens.size).toBe(32)
  })

  it('hashes a token deterministically to 64 hex characters', async () => {
    const token = generateSessionToken()
    const hash = await hashToken(token)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    await expect(hashToken(token)).resolves.toBe(hash)
  })

  it('produces different hashes for different tokens', async () => {
    const [a, b] = await Promise.all([
      hashToken(generateSessionToken()),
      hashToken(generateSessionToken()),
    ])
    expect(a).not.toBe(b)
  })
})

describe('encoding helpers', () => {
  it('round-trips base64url without padding', () => {
    const bytes = new Uint8Array([0, 1, 250, 251, 252, 253, 254, 255])
    const encoded = base64UrlEncode(bytes)
    expect(encoded).not.toContain('=')
    expect(base64UrlDecode(encoded)).toEqual(bytes)
  })

  it('round-trips byte lengths around the padding boundaries', () => {
    for (const length of [1, 2, 3, 4, 5, 6, 31, 32, 33]) {
      const bytes = new Uint8Array(length).map((_, index) => (index * 7) % 256)
      expect(base64UrlDecode(base64UrlEncode(bytes))).toEqual(bytes)
    }
  })

  it('produces url-safe output for bytes that would encode as + and /', () => {
    const bytes = new Uint8Array([251, 255, 190])
    const encoded = base64UrlEncode(bytes)
    expect(encoded).not.toMatch(/[+/=]/)
    expect(base64UrlDecode(encoded)).toEqual(bytes)
  })

  it('compares equal and unequal buffers', () => {
    const a = new Uint8Array([1, 2, 3])
    expect(timingSafeEqual(a, new Uint8Array([1, 2, 3]))).toBe(true)
    expect(timingSafeEqual(a, new Uint8Array([1, 2, 4]))).toBe(false)
    expect(timingSafeEqual(a, new Uint8Array([1, 2]))).toBe(false)
    expect(timingSafeEqual(a, new Uint8Array())).toBe(false)
  })
})
