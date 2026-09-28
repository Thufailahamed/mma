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

export const ARTICLE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number]

export const ARTICLE_CATEGORIES = [
  'ANALYSIS',
  'FIGHT_BREAKDOWN',
  'OPINION',
  'NEWS',
  'INTERVIEW',
  'RANKINGS',
  'HISTORY',
] as const
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]

export const POLL_STATUSES = ['DRAFT', 'OPEN', 'CLOSED'] as const
export type PollStatus = (typeof POLL_STATUSES)[number]

export const TRIVIA_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const
export type TriviaDifficulty = (typeof TRIVIA_DIFFICULTIES)[number]

export const REPORT_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

export const COMMENT_STATUSES = ['VISIBLE', 'PENDING', 'HIDDEN', 'DELETED'] as const
export type CommentStatus = (typeof COMMENT_STATUSES)[number]
