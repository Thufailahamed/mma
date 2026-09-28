import { createDb } from '@mma/db'
import { createMetricsRepo } from '@mma/db/repositories'
import { Hono } from 'hono'
import type { Env, SessionUser } from '../env'
import { ok } from '../errors'

type AdminEnv = { Bindings: Env; Variables: { user: SessionUser; requestId: string } }

const ACTIVE_WINDOW_DAYS = 30

export function createAdminRoutes() {
  const routes = new Hono<AdminEnv>()

  routes.get('/metrics', async (c) => {
    const repo = createMetricsRepo(createDb(c.env))
    const since = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000)

    const [users, articles, upcomingEvents, liveEvents, triviaAttempts, activeUsers] =
      await Promise.all([
        repo.userCount(),
        repo.articleCount(),
        repo.upcomingEventCount(),
        repo.liveEventCount(),
        repo.triviaAttemptCount(),
        repo.activeUserCount(since),
      ])

    return ok({
      users,
      articles,
      upcomingEvents,
      liveEvents,
      triviaAttempts,
      activeUsers,
      activeWindowDays: ACTIVE_WINDOW_DAYS,
    })
  })

  return routes
}
