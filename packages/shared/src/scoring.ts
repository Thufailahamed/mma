/**
 * Scoring rules are versioned in source rather than stored as data, and the
 * version is stamped onto every resolved prediction. That is what makes the
 * rule "never re-score historical predictions with a later rule set"
 * enforceable: the resolver reads the version, not the current constants.
 */
export const PREDICTION_SCORING_VERSION = 'v1'

export const PREDICTION_POINTS = {
  winner: 10,
  method: 5,
  round: 10,
  bonusPerQuestion: 3,
} as const

export const XP_REWARDS = {
  registration: 50,
  predictionSubmitted: 10,
  predictionCorrect: 25,
  triviaCorrect: 10,
  dailyStreakDay: 3,
} as const

export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1)
}
