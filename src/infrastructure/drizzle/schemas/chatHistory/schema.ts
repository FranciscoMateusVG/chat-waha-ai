import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Chat histories table (aggregate root)
export const chatHistories = sqliteTable(
  'chat_histories',
  {
    id: text('id').primaryKey(),
    externalChatId: text('external_chat_id').notNull(), // WhatsApp chat ID
    chatName: text('chat_name').notNull(),
    status: text('status').notNull(), // 'open' | 'closed'
    lastMessageSender: text('last_message_sender').notNull(), // 'user' | 'owner' | 'ai' | 'system'
    openedAt: integer('opened_at', { mode: 'timestamp' }).notNull(),
    lastMessageAt: integer('last_message_at', { mode: 'timestamp' }).notNull(),
    closedAt: integer('closed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    externalChatIdIdx: index('idx_chat_histories_external_chat_id').on(
      table.externalChatId
    ),
    statusIdx: index('idx_chat_histories_status').on(table.status),
    lastMessageAtIdx: index('idx_chat_histories_last_message_at').on(
      table.lastMessageAt
    ),
    // Composite index for finding open chats by external ID (most common query)
    statusExternalChatIdIdx: index('idx_chat_histories_status_external').on(
      table.status,
      table.externalChatId
    )
  })
)

// Chat messages table (child entities within aggregate)
export const chatMessages = sqliteTable(
  'chat_messages',
  {
    id: text('id').primaryKey(),
    chatHistoryId: text('chat_history_id')
      .notNull()
      .references(() => chatHistories.id, { onDelete: 'cascade' }), // Delete messages when chat deleted
    content: text('content').notNull(),
    sender: text('sender').notNull(), // 'user' | 'owner' | 'ai' | 'system'
    mentionedAi: integer('mentioned_ai', { mode: 'boolean' })
      .default(false)
      .notNull(), // For group chats
    timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    chatHistoryIdIdx: index('idx_chat_messages_chat_history_id').on(
      table.chatHistoryId
    ),
    timestampIdx: index('idx_chat_messages_timestamp').on(table.timestamp),
    senderIdx: index('idx_chat_messages_sender').on(table.sender),
    // Composite index for common query: get messages for a chat ordered by time
    chatHistoryTimestampIdx: index('idx_chat_messages_chat_timestamp').on(
      table.chatHistoryId,
      table.timestamp
    )
  })
)

// Type exports for TypeScript
export type ChatHistorySelect = typeof chatHistories.$inferSelect
export type ChatHistoryInsert = typeof chatHistories.$inferInsert

export type ChatMessageSelect = typeof chatMessages.$inferSelect
export type ChatMessageInsert = typeof chatMessages.$inferInsert
