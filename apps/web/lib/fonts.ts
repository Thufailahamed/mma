import { Archivo, Inter, JetBrains_Mono } from 'next/font/google'

/** Body and UI. Two families on every page outside the live experience. */
export const fontSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

/**
 * Display type for fighter names, section headers, and the scoreboard.
 *
 * Archivo is a variable font spanning both weight (100–900) and width
 * (62–125). Requesting `wdth` requires weight to be 'variable' rather than a
 * list of weights; without it the width axis silently does nothing.
 */
export const fontDisplay = Archivo({
  subsets: ['latin'],
  display: 'swap',
  weight: 'variable',
  axes: ['wdth'],
  variable: '--font-display',
})

/** Telemetry only: the live round clock, XP deltas, timestamps. */
export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})
