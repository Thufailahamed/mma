import { describe, expect, it } from 'vitest'
import { AppError, levelForXp } from '@mma/shared'
import { fail, ok, toAppError } from '../src/errors'

describe('AppError', () => {
  it('maps validation failures to 400 with field details', () => {
    const error = AppError.validation('Request body failed validation.', [
      { path: 'email', message: 'Invalid email' },
    ])
    expect(error.status).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.details).toEqual([{ path: 'email', message: 'Invalid email' }])
  })

  it('maps unauthenticated to 401 and forbidden to 403', () => {
    expect(AppError.unauthenticated().status).toBe(401)
    expect(AppError.forbidden().status).toBe(403)
    expect(AppError.notFound().status).toBe(404)
    expect(AppError.rateLimited().status).toBe(429)
  })

  it('omits details when none are supplied', () => {
    expect(AppError.notFound().details).toBeUndefined()
  })

  it('maps a locked prediction to a 409 with a distinct code', () => {
    const error = AppError.conflict('PREDICTION_LOCKED', 'Predictions are closed for this fight.')
    expect(error.status).toBe(409)
    expect(error.code).toBe('PREDICTION_LOCKED')
  })
})

describe('toAppError', () => {
  it('passes an AppError through unchanged', () => {
    const original = AppError.notFound()
    expect(toAppError(original)).toBe(original)
  })

  it('wraps an unknown throw as a 500 without leaking internals', () => {
    const wrapped = toAppError(new Error('connect ECONNREFUSED 10.0.0.1:5432'))
    expect(wrapped.status).toBe(500)
    expect(wrapped.code).toBe('INTERNAL_ERROR')
    expect(wrapped.message).toBe('An unexpected error occurred.')
    expect(wrapped.message).not.toContain('10.0.0.1')
  })
})

describe('response envelope', () => {
  it('wraps success payloads', async () => {
    const res = ok({ id: '1' })
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true, data: { id: '1' } })
  })

  it('wraps failures with a request id and omits absent details', async () => {
    const res = fail(AppError.unauthenticated(), 'req-123')
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required.', requestId: 'req-123' },
    })
  })

  it('includes field details when present', async () => {
    const res = fail(
      AppError.validation('Bad.', [{ path: 'password', message: 'Too short' }]),
      'req-9',
    )
    const body = await res.json()
    expect(body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: [{ path: 'password', message: 'Too short' }] },
    })
  })

  it('returns 503 for a degraded health response', () => {
    expect(ok({ status: 'degraded' }, 503).status).toBe(503)
  })

  it('returns 204 with no body', () => {
    const res = ok({ ignored: true }, 204)
    expect(res.status).toBe(204)
  })
})

describe('levelForXp', () => {
  it('starts at level 1 and grows with XP', () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(99)).toBe(1)
    expect(levelForXp(100)).toBe(2)
    expect(levelForXp(900)).toBe(4)
  })

  it('never returns a level below 1 for negative XP', () => {
    expect(levelForXp(-50)).toBe(1)
  })
})
