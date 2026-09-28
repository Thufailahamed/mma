import { z } from 'zod'
import { paginationSchema, slugSchema } from './common'

export const promotionSlugSchema = z.object({ slug: slugSchema })

export const promotionsQuerySchema = paginationSchema

export const imageQuerySchema = z.object({
  w: z.coerce.number().int().min(16).max(2048).optional(),
  f: z.enum(['auto', 'avif', 'webp', 'jpeg', 'png']).optional(),
  q: z.coerce.number().int().min(40).max(95).optional(),
})

export type ImageQuery = z.infer<typeof imageQuerySchema>
