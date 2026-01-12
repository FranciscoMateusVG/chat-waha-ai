import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

export const knowledgeEntries = sqliteTable(
  'knowledge_entries',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    type: text('type').notNull(),
    topic: text('topic').notNull(),
    key: text('key').notNull(),
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
    // Key must be unique per user, not globally
    userKeyUnique: unique('idx_knowledge_user_key').on(table.userId, table.key),
    userIdIdx: index('idx_knowledge_user_id').on(table.userId),
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
