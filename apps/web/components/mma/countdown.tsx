'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

function remaining(target: number): number {
  return Math.max(0, target - Date.now())
}

function format(ms: number): string {
  const total = Math.floor(ms / 1000)
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return days > 0
    ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export interface CountdownProps {
  /** ISO 8601 datetime. */
  target: string
  className?: string
}

export function Countdown({ target, className }: CountdownProps) {
  const deadline = new Date(target).getTime()
  // Rendered on the server first, so the value must not be read from the
  // client clock during hydration.
  const [ms, setMs] = useState(() => (Number.isNaN(deadline) ? 0 : remaining(deadline)))

  useEffect(() => {
    if (Number.isNaN(deadline)) return
    const timer = setInterval(() => setMs(remaining(deadline)), 1000)
    return () => clearInterval(timer)
  }, [deadline])

  if (Number.isNaN(deadline)) return null

  return (
    <time
      dateTime={target}
      className={cn('tabular font-mono text-lg', className)}
      suppressHydrationWarning
    >
      {format(ms)}
    </time>
  )
}
