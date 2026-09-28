import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { ARTICLE_CATEGORIES, ARTICLE_STATUSES } from './enums'
import { events, fights } from './mma'
import { fighters } from './reference'
import { users } from './identity'

const createdAt = integer('created_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

const updatedAt = integer('updated_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

export const articles = sqliteTable(
  'articles',
  {
    id: text('id').primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    excerpt: text('excerpt'),
    // Serialised block document (TipTap/ProseMirror JSON), not Markdown, so
    // fighter cards, fight cards, and poll widgets can be embedded inline.
    content: text('content').notNull(),
    coverImageUrl: text('cover_image_url'),
    category: text('category', { enum: ARTICLE_CATEGORIES }).notNull(),
    status: text('status', { enum: ARTICLE_STATUSES }).notNull().default('DRAFT'),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex('articles_slug_unique').on(t.slug),
    index('articles_author_idx').on(t.authorId),
    index('articles_status_published_idx').on(t.status, t.publishedAt),
    index('articles_category_idx').on(t.category),
    check(
      'articles_status_check',
      sql`${t.status} IN ('DRAFT','PUBLISHED','ARCHIVED')`,
    ),
    check(
      'articles_category_check',
      sql`${t.category} IN ('ANALYSIS','FIGHT_BREAKDOWN','OPINION','NEWS','INTERVIEW','RANKINGS','HISTORY')`,
    ),
    check(
      'articles_published_at_required',
      sql`${t.status} <> 'PUBLISHED' OR ${t.publishedAt} IS NOT NULL`,
    ),
  ],
)

export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
  },
  (t) => [uniqueIndex('tags_slug_unique').on(t.slug), uniqueIndex('tags_name_unique').on(t.name)],
)

export const articleTags = sqliteTable(
  'article_tags',
  {
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.tagId] }), index('article_tags_tag_idx').on(t.tagId)],
)

export const articleFighters = sqliteTable(
  'article_fighters',
  {
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    fighterId: text('fighter_id')
      .notNull()
      .references(() => fighters.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.articleId, t.fighterId] }),
    index('article_fighters_fighter_idx').on(t.fighterId),
  ],
)

export const articleEvents = sqliteTable(
  'article_events',
  {
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.articleId, t.eventId] }),
    index('article_events_event_idx').on(t.eventId),
  ],
)

export const articleFights = sqliteTable(
  'article_fights',
  {
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    fightId: text('fight_id')
      .notNull()
      .references(() => fights.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.articleId, t.fightId] }),
    index('article_fights_fight_idx').on(t.fightId),
  ],
)

export const articleRevisions = sqliteTable(
  'article_revisions',
  {
    id: text('id').primaryKey(),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    editorId: text('editor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    createdAt,
  },
  (t) => [index('article_revisions_article_created_idx').on(t.articleId, t.createdAt)],
)
