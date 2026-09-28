export const USER_ROLES = ['USER', 'EDITOR', 'ADMIN'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const GENDERS = ['MALE', 'FEMALE'] as const
export type Gender = (typeof GENDERS)[number]

export const STANCES = ['ORTHODOX', 'SOUTHPAW', 'SWITCH'] as const
export type Stance = (typeof STANCES)[number]

export const EVENT_STATUSES = ['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export const FIGHT_STATUSES = ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'] as const
export type FightStatus = (typeof FIGHT_STATUSES)[number]

export const FIGHT_RESULTS = [
  'KO',
  'TKO',
  'SUBMISSION',
  'DECISION_UNANIMOUS',
  'DECISION_SPLIT',
  'DECISION_MAJORITY',
  'DRAW',
  'NO_CONTEST',
  'NC',
] as const
export type FightResult = (typeof FIGHT_RESULTS)[number]

export const FIGHT_METHODS = ['KO', 'TKO', 'SUBMISSION', 'DECISION', 'DRAW', 'NO_CONTEST'] as const
export type FightMethod = (typeof FIGHT_METHODS)[number]
