import { cn } from '@/lib/utils'

export interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  className?: string
}

export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-card px-4 py-3 shadow-card transition-shadow hover:shadow-card-hover',
        className,
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="tabular mt-1 font-display text-2xl font-extrabold tracking-tight">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
