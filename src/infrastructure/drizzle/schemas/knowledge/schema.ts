import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const knowledgeEntries = sqliteTable(
  'knowledge_entries',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    topic: text('topic').notNull(),
    key: text('key').notNull().unique(),
    content: text('content').notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>(),
    metadata: text('metadata', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    typeIdx: index('idx_knowledge_type').on(table.type),
    topicIdx: index('idx_knowledge_topic').on(table.topic),
    keyIdx: index('idx_knowledge_key').on(table.key),
    tagsIdx: index('idx_knowledge_tags').on(table.tags),
    createdAtIdx: index('idx_knowledge_created_at').on(table.createdAt)
  })
)

export type KnowledgeEntryRecord = typeof knowledgeEntries.$inferSelect
export type NewKnowledgeEntryRecord = typeof knowledgeEntries.$inferInsert

// Re-export system prompt schema
export * from './system-prompt-schema'
