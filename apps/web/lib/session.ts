import { cookies } from 'next/headers'
import { describeSession, type SessionUser } from '@/lib/api'

const apiOrigin = process.env.API_ORIGIN ?? 'https://localhost:8787'

/**
 * Reads the current session on the server so the header can render without a
 * client round trip. Returns null rather than throwing: an unauthenticated
 * visitor is the normal case, not an error.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get('mma_session')?.value
  if (token === undefined) return null

  try {
    const response = await fetch(`${apiOrigin}/api/auth/me`, {
      headers: { cookie: `mma_session=${token}` },
      cache: 'no-store',
    })
    if (!response.ok) return null

    const payload: unknown = await response.json()
    if (typeof payload !== 'object' || payload === null) return null

    const data = (payload as { data?: unknown }).data
    return describeSession(data)
  } catch {
    return null
  }
}
