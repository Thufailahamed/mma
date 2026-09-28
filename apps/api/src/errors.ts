import { AppError, type ApiFailure, type ApiSuccess } from '@mma/shared'

type OkStatus = 200 | 201 | 204 | 503

export function ok<T>(data: T, status: OkStatus = 200): Response {
  if (status === 204) return new Response(null, { status })
  return Response.json({ success: true, data } satisfies ApiSuccess<T>, { status })
}

export function fail(error: AppError, requestId: string): Response {
  const body: ApiFailure = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
      requestId,
    },
  }
  return Response.json(body, { status: error.status })
}

/**
 * Anything that is not already an AppError becomes an opaque 500. Internals
 * are logged with a request id, never returned to the client.
 */
export function toAppError(cause: unknown): AppError {
  return cause instanceof AppError
    ? cause
    : new AppError('INTERNAL_ERROR', 500, 'An unexpected error occurred.')
}
