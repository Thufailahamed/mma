export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PREDICTION_LOCKED'
  | 'SCORING_WINDOW_CLOSED'
  | 'RATE_LIMITED'
  | 'CSRF_TOKEN_INVALID'
  | 'INTERNAL_ERROR'

export interface FieldIssue {
  path: string
  message: string
}

export interface ApiErrorBody {
  code: ErrorCode
  message: string
  details?: FieldIssue[]
  requestId?: string
}

export type ApiSuccess<T> = { success: true; data: T }
export type ApiFailure = { success: false; error: ApiErrorBody }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
