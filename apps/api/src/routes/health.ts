import { createDb } from '@mma/db'
import { sql } from 'drizzle-orm'
import type { Handler } from 'hono'
import type { Env } from '../env'
import { ok } from '../errors'

async function probeD1(env: Env): Promise<'reachable' | 'unreachable'> {
  try {
    await createDb(env).run(sql`SELECT 1`)
    return 'reachable'
  } catch {
    return 'unreachable'
  }
}

async function probeR2(env: Env): Promise<'reachable' | 'unreachable'> {
  try {
    await env.MEDIA.list({ limit: 1 })
    return 'reachable'
  } catch {
    return 'unreachable'
  }
}

export const healthHandler: Handler<{ Bindings: Env }> = async (c) => {
  const [d1, r2] = await Promise.all([probeD1(c.env), probeR2(c.env)])
  const degraded = d1 === 'unreachable' || r2 === 'unreachable'
  return ok({ status: degraded ? 'degraded' : 'ok', d1, r2 }, degraded ? 503 : 200)
}
