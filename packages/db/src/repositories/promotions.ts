import { eq, sql } from 'drizzle-orm'
import type { Db } from '../client'
import { divisions, promotions } from '../schema/reference'

export function createPromotionsRepo(db: Db) {
  return {
    list(limit: number, offset: number) {
      return db
        .select()
        .from(promotions)
        .orderBy(sql`${promotions.name} ASC`)
        .limit(limit)
        .offset(offset)
        .all()
    },

    findBySlug(slug: string) {
      return db.select().from(promotions).where(eq(promotions.slug, slug)).get()
    },

    listDivisionsByPromotionSlug(slug: string) {
      return db
        .select({
          id: divisions.id,
          name: divisions.name,
          gender: divisions.gender,
          weightLimit: divisions.weightLimit,
          slug: divisions.slug,
        })
        .from(divisions)
        .innerJoin(promotions, eq(divisions.promotionId, promotions.id))
        .where(eq(promotions.slug, slug))
        .orderBy(sql`${divisions.gender} ASC, ${divisions.weightLimit} ASC`)
        .all()
    },
  }
}

export type PromotionsRepo = ReturnType<typeof createPromotionsRepo>
