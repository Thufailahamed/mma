import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema, toFieldIssues, uuidSchema } from '@mma/validation'

describe('common schemas', () => {
  it('accepts a canonical UUID and rejects other strings', () => {
    expect(uuidSchema.safeParse('0192f3c1-8a4b-7c2d-9e1f-2b3c4d5e6f70').success).toBe(true)
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false)
    expect(uuidSchema.safeParse('').success).toBe(false)
  })

  it('flattens Zod issues into field issues keyed by path', () => {
    const result = registerSchema.safeParse({ email: 'nope', username: 'a', password: 'short' })
    expect(result.success).toBe(false)
    if (result.success) return
    const issues = toFieldIssues(result.error)
    const paths = issues.map((issue) => issue.path)
    expect(paths).toContain('email')
    expect(paths).toContain('password')
    for (const issue of issues) {
      expect(typeof issue.message).toBe('string')
      expect(issue.message.length).toBeGreaterThan(0)
    }
  })
})

describe('registerSchema', () => {
  const valid = {
    email: 'Fighter@Example.COM',
    username: 'tapout_tony',
    displayName: 'Tony',
    password: 'a-long-enough-password',
  }

  it('normalises the email and accepts a valid payload', () => {
    const result = registerSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.email).toBe('fighter@example.com')
  })

  it('rejects a short password', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false)
  })

  it('rejects a bad or short username', () => {
    expect(registerSchema.safeParse({ ...valid, username: 'has spaces' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, username: 'ab' }).success).toBe(false)
  })

  it('requires a display name', () => {
    expect(registerSchema.safeParse({ email: valid.email, username: valid.username, password: valid.password }).success).toBe(false)
  })

  it('strips unknown keys so a client cannot smuggle a role', () => {
    const result = registerSchema.safeParse({ ...valid, role: 'ADMIN', xp: 9999 })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).not.toHaveProperty('role')
    expect(result.data).not.toHaveProperty('xp')
  })
})

describe('loginSchema', () => {
  it('requires an email and a password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true)
    expect(loginSchema.safeParse({ email: 'a@b.com' }).success).toBe(false)
    expect(loginSchema.safeParse({ password: 'x' }).success).toBe(false)
  })

  it('does not impose a minimum length on an existing password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true)
  })
})
