import { z } from 'zod'

/**
 * Trims and lowercases before validating, because z.email() is a top-level
 * schema in Zod 4 and cannot be chained after .trim()/.toLowerCase().
 */
const emailSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.email().max(254),
)

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Use 3–24 lowercase letters, numbers, or underscores')
  .max(24, 'Use 3–24 lowercase letters, numbers, or underscores')
  .regex(/^[a-z0-9_]+$/, 'Use 3–24 lowercase letters, numbers, or underscores')

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(60),
  password: z.string().min(12, 'Use at least 12 characters').max(200),
})

export const loginSchema = z.object({
  email: emailSchema,
  // No minimum here: an existing account may predate the current policy.
  password: z.string().min(1).max(200),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
