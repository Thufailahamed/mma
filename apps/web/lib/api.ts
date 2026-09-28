import type { ApiFailure, ApiSuccess, ErrorCode, FieldIssue } from '@mma/shared'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export const CSRF_COOKIE = 'mma_csrf'

export class ApiError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details: FieldIssue[]

  constructor(code: ErrorCode, status: number, message: string, details: FieldIssue[] = []) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

/**
 * The CSRF cookie is deliberately not HttpOnly: the browser has to read it to
 * echo it back in the X-CSRF-Token header.
 */
export function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  for (const part of document.cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === CSRF_COOKIE) return decodeURIComponent(rest.join('='))
  }
  return null
}

/**
 * The single fetch path for the browser. Every request goes through here, so
 * the CSRF header, the error shape, and the credentials mode cannot be
 * forgotten at a call site.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)

  if (!SAFE_METHODS.has(method)) {
    headers.set('content-type', 'application/json')
    const token = readCsrfToken()
    if (token !== null) headers.set('x-csrf-token', token)
  }

  const response = await fetch(path, { ...init, headers, credentials: 'same-origin' })
  const parsed: unknown = await response.json()
  const payload = parsed as ApiSuccess<T> | ApiFailure

  if (!response.ok || !payload.success) {
    const error = (payload as ApiFailure).error
    throw new ApiError(
      error?.code ?? 'INTERNAL_ERROR',
      response.status,
      error?.message ?? 'Request failed.',
      error?.details ?? [],
    )
  }

  return (payload).data
}

export const apiGet = <T,>(path: string) => apiRequest<T>(path)

export const apiPost = <T,>(path: string, body: unknown) =>
  apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const apiLogout = () => apiPost<{ signedOut: boolean }>('/api/auth/logout', {})

export interface SessionUser {
  id: string
  email: string
  username: string
  displayName: string
  role: 'USER' | 'EDITOR' | 'ADMIN'
}

export function describeSession(value: unknown): SessionUser | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Partial<SessionUser>
  if (typeof candidate.id !== 'string' || typeof candidate.displayName !== 'string') return null
  return {
    id: candidate.id,
    email: candidate.email ?? '',
    username: candidate.username ?? '',
    displayName: candidate.displayName,
    role: candidate.role ?? 'USER',
  }
}
