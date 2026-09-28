import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { EmptyState, SectionHeader } from '@/components/mma'

export interface HomeSectionProps {
  title: string
  icon: LucideIcon
  /** What is missing. */
  emptyTitle: string
  /** Why it is missing. */
  emptyDescription: string
  /** The one action that changes it. */
  action?: { href: string; label: string }
  href?: string
  /**
   * Populated from Phase 2 onward. Absent in Phase 1, which renders the empty
   * state rather than fabricating content.
   */
  children?: ReactNode
}

export function HomeSection({
  title,
  icon,
  emptyTitle,
  emptyDescription,
  action,
  href,
  children,
}: HomeSectionProps) {
  return (
    <section className="space-y-3">
      <SectionHeader title={title} href={href} />
      {children ?? (
        <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} action={action} />
      )}
    </section>
  )
}
