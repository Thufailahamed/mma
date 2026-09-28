'use client'

import { animate, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

export interface CountUpProps {
  value: number
  durationMs?: number
  className?: string
}

/** Animated numerals for prediction percentages and score deltas. */
export function CountUp({ value, durationMs = 600, className }: CountUpProps) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration: durationMs / 1000,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [value, durationMs, reduce])

  return (
    <span className={className} suppressHydrationWarning>
      {display}
    </span>
  )
}
