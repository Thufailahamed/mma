import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ErrorStateProps {
  title: string
  description: string
  onRetry?: () => void
  className?: string
}

/**
 * A failed region never becomes a blank box, and never swallows the error.
 * The request id is logged server-side and shown on any thrown AppError.
 */
export function ErrorState({ title, description, onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-border bg-card px-6 py-10 text-center shadow-card',
        className,
      )}
    >
      <AlertTriangle aria-hidden className="size-7 text-live" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-md border border-border px-3 py-2 text-sm font-semibold transition-colors hover:border-live hover:text-live"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}
