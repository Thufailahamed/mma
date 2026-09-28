'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

export interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

/**
 * Staggered entrance for lists. Transform and opacity only, so it never
 * triggers layout or paint on a long list.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-64px' }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
