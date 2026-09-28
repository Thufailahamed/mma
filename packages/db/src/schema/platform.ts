import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { REPORT_STATUSES } from './enums'
import { users } from './identity'

const createdAt = integer('created_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

export const mediaAssets = sqliteTable(
  'media_assets',
  {
    id: text('id').primaryKey(),
    objectKey: text('object_key').notNull(),
    contentType: text('content_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    width: integer('width'),
    height: integer('height'),
    alt: text('alt'),
    uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt,
  },
  (t) => [
    index('media_assets_object_key_idx').on(t.objectKey),
    index('media_assets_uploaded_by_idx').on(t.uploadedBy),
    check('media_assets_byte_size_non_negative', sql`${t.byteSize} >= 0`),
    check(
      'media_assets_dimensions_valid',
      sql`(${t.width} IS NULL OR ${t.width} > 0) AND (${t.height} IS NULL OR ${t.height} > 0)`,
    ),
  ],
)

export const reports = sqliteTable(
  'reports',
  {
    id: text('id').primaryKey(),
    reporterId: text('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    reason: text('reason').notNull(),
    details: text('details'),
    status: text('status', { enum: REPORT_STATUSES }).notNull().default('OPEN'),
    resolvedBy: text('resolved_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt,
  },
  (t) => [
    index('reports_status_idx').on(t.status),
    index('reports_entity_idx').on(t.entityType, t.entityId),
    index('reports_reporter_idx').on(t.reporterId),
    check(
      'reports_status_check',
      sql`${t.status} IN ('OPEN','REVIEWING','RESOLVED','DISMISSED')`,
    ),
  ],
)
