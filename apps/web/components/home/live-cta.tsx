import { Radio } from 'lucide-react'
import { LiveIndicator } from '@/components/mma'

/**
 * Fight Night Mode is Phase 6. The control is visibly disabled and labelled
 * rather than live-looking and broken: a dimmed, honest button instead of a
 * button that goes nowhere.
 */
export function LiveCta() {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-gradient-to-br from-card to-surface-raised p-6 shadow-card sm:flex-row sm:items-center">
      <div className="space-y-1">
        <LiveIndicator state="upcoming" label="COMING SOON" />
        <h2 className="font-display text-xl font-extrabold tracking-tight">Fight Night Mode</h2>
        <p className="text-sm text-muted-foreground">
          Live rounds, community scoring, and real-time picks at /live/[eventSlug].
        </p>
      </div>
      <button
        type="button"
        disabled
        className="ml-auto inline-flex h-11 items-center gap-2 rounded-md bg-surface-raised px-4 text-sm font-semibold text-muted-foreground"
      >
        <Radio aria-hidden className="size-4" />
        Arrives in Phase 6
      </button>
    </section>
  )
}
