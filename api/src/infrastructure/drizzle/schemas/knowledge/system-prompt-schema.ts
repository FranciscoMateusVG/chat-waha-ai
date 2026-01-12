import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const systemPrompts = sqliteTable(
  'system_prompts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().unique(),
    content: text('content').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    userIdIdx: index('idx_system_prompts_user_id').on(table.userId)
  })
)

export type SystemPromptRecord = typeof systemPrompts.$inferSelect
export type NewSystemPromptRecord = typeof systemPrompts.$inferInsert
