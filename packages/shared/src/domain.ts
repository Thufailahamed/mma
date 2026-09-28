import type { ErrorCode, FieldIssue } from './envelope'

type ConflictCode = Extract<ErrorCode, 'CONFLICT' | 'PREDICTION_LOCKED' | 'SCORING_WINDOW_CLOSED'>
type AppErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500

export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: AppErrorStatus
  readonly details?: FieldIssue[]

  constructor(code: ErrorCode, status: AppErrorStatus, message: string, details?: FieldIssue[]) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
    if (details !== undefined) this.details = details
  }

  static validation(message: string, details: FieldIssue[]): AppError {
    return new AppError('VALIDATION_ERROR', 400, message, details)
  }

  static unauthenticated(message = 'Authentication required.'): AppError {
    return new AppError('UNAUTHENTICATED', 401, message)
  }

  static forbidden(message = 'You do not have access to this resource.'): AppError {
    return new AppError('FORBIDDEN', 403, message)
  }

  static notFound(message = 'Resource not found.'): AppError {
    return new AppError('NOT_FOUND', 404, message)
  }

  static conflict(code: ConflictCode, message: string): AppError {
    return new AppError(code, 409, message)
  }

  static rateLimited(message = 'Too many requests. Please slow down.'): AppError {
    return new AppError('RATE_LIMITED', 429, message)
  }
}
