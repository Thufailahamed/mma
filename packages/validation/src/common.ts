import { AppError, type FieldIssue } from '@mma/shared'
import { z } from 'zod'

/** Zod 4 moved string formats to the top level: z.uuid(), z.email(). */
export const uuidSchema = z.uuid()

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Must be lowercase alphanumeric segments separated by hyphens',
  )

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export function toFieldIssues(error: z.ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '_root',
    message: issue.message,
  }))
}

/**
 * The single parse entry point for API boundaries. Throws an AppError carrying
 * field-level details, so a route never hand-rolls validation branching.
 */
export function parseOrThrow<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  throw AppError.validation('Request failed validation.', toFieldIssues(result.error))
}
