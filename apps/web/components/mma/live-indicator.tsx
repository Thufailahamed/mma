import { cn } from '@/lib/utils'

export interface LiveIndicatorProps {
  state: 'live' | 'upcoming' | 'off'
  label?: string
  className?: string
}

/** The --live colour is reserved for this component and never used decoratively. */
export function LiveIndicator({ state, label, className }: LiveIndicatorProps) {
  if (state === 'off') return null
  const isLive = state === 'live'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold tracking-[0.1em]',
        isLive ? 'bg-live text-white' : 'border border-border text-muted-foreground',
        className,
      )}
    >
      {isLive ? (
        <span aria-hidden className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-white" />
        </span>
      ) : null}
      {label ?? (isLive ? 'LIVE' : 'UPCOMING')}
    </span>
  )
}
