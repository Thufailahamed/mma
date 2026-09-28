import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface SectionHeaderProps {
  title: string
  /** Every section answers "what next"; this link is that answer. */
  href?: string
  actionLabel?: string
  className?: string
}

export function SectionHeader({ title, href, actionLabel = 'View all', className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-baseline gap-3', className)}>
      <h2 className="text-xs font-bold uppercase tracking-[0.15em]">{title}</h2>
      {href ? (
        <Link href={href} className="ml-auto text-xs font-semibold text-primary hover:text-live">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
