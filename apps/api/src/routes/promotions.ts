import { createDb } from '@mma/db'
import { createPromotionsRepo } from '@mma/db/repositories'
import { Hono } from 'hono'
import { AppError } from '@mma/shared'
import { parseOrThrow, promotionSlugSchema, promotionsQuerySchema } from '@mma/validation'
import type { Env } from '../env'
import { ok } from '../errors'

type PromoEnv = { Bindings: Env; Variables: { requestId: string } }

export function createPromotionRoutes() {
  const routes = new Hono<PromoEnv>()

  routes.get('/', async (c) => {
    const { limit, offset } = parseOrThrow(promotionsQuerySchema, c.req.query())
    const promotions = await createPromotionsRepo(createDb(c.env)).list(limit, offset)
    return ok({ promotions, limit, offset })
  })

  routes.get('/:slug/divisions', async (c) => {
    const { slug } = parseOrThrow(promotionSlugSchema, { slug: c.req.param('slug') })
    const repo = createPromotionsRepo(createDb(c.env))

    if ((await repo.findBySlug(slug)) === undefined) {
      throw AppError.notFound('No such promotion.')
    }

    return ok({ divisions: await repo.listDivisionsByPromotionSlug(slug) })
  })

  return routes
}
