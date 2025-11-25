import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const systemPrompts = sqliteTable('system_prompts', {
  id: text('id').primaryKey().default('system-prompt'),
  content: text('content').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
})

export type SystemPromptRecord = typeof systemPrompts.$inferSelect
export type NewSystemPromptRecord = typeof systemPrompts.$inferInsert
