import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: LucideIcon
  /** What is missing. */
  title: string
  /** Why it is missing. */
  description: string
  /** The one action that changes it. */
  action?: { href: string; label: string }
  className?: string
}

/**
 * A component never renders null or a bare "No data" string. Every empty
 * region states what is missing, why, and one action that changes it.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-border bg-card px-6 py-10 text-center shadow-card',
        className,
      )}
    >
      <Icon aria-hidden className="size-7 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="mt-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-live"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
