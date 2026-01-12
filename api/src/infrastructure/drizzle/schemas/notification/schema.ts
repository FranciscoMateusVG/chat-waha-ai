import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Notifications table (write model - domain aggregates)
export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(), // Owner of this notification (multi-tenant isolation)
    recipientId: text('recipient_id').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    channel: text('channel').notNull(),
    status: text('status').notNull(),
    metadata: text('metadata', { mode: 'json' }),
    batchId: text('batch_id'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    sentAt: integer('sent_at', { mode: 'timestamp' }),
    contactInfo: text('contact_info'),
    errorMessage: text('error_message'),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    userIdIdx: index('idx_notifications_user_id').on(table.userId),
    recipientIdx: index('idx_notifications_recipient').on(table.recipientId),
    statusIdx: index('idx_notifications_status').on(table.status),
    channelIdx: index('idx_notifications_channel').on(table.channel),
    createdAtIdx: index('idx_notifications_created_at').on(table.createdAt)
  })
)

// Notification batches table
export const notificationBatches = sqliteTable(
  'notification_batches',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(), // Owner of this batch (multi-tenant isolation)
    channel: text('channel').notNull(),
    status: text('status').notNull(),
    notificationCount: integer('notification_count').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    processedAt: integer('processed_at', { mode: 'timestamp' }),
    errorMessage: text('error_message'),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    userIdIdx: index('idx_notification_batches_user_id').on(table.userId),
    statusIdx: index('idx_notification_batches_status').on(table.status),
    channelIdx: index('idx_notification_batches_channel').on(table.channel)
  })
)

// Notification history (read model - CQRS)
export const notificationHistory = sqliteTable(
  'notification_history',
  {
    notificationId: text('notification_id').primaryKey(),
    userId: text('user_id').notNull(), // Owner of this notification (multi-tenant isolation)
    recipientId: text('recipient_id').notNull(),
    channel: text('channel').notNull(),
    status: text('status').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    metadata: text('metadata', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    sentAt: integer('sent_at', { mode: 'timestamp' }),
    failedReason: text('failed_reason')
  },
  (table) => ({
    userIdIdx: index('idx_notification_history_user_id').on(table.userId),
    recipientIdx: index('idx_notification_history_recipient').on(
      table.recipientId
    ),
    channelIdx: index('idx_notification_history_channel').on(table.channel),
    statusIdx: index('idx_notification_history_status').on(table.status),
    createdAtIdx: index('idx_notification_history_created_at').on(
      table.createdAt
    )
  })
)

// Notification stats (read model - aggregated data)
export const notificationStats = sqliteTable(
  'notification_stats',
  {
    id: text('id').primaryKey(), // user-date-channel combination
    userId: text('user_id').notNull(), // Owner of these stats (multi-tenant isolation)
    date: text('date').notNull(), // YYYY-MM-DD format
    channel: text('channel').notNull(),
    totalSent: integer('total_sent').default(0).notNull(),
    totalFailed: integer('total_failed').default(0).notNull(),
    totalDelivered: integer('total_delivered').default(0).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    userIdIdx: index('idx_notification_stats_user_id').on(table.userId),
    dateIdx: index('idx_notification_stats_date').on(table.date),
    channelIdx: index('idx_notification_stats_channel').on(table.channel),
    userDateChannelIdx: index('idx_notification_stats_user_date_channel').on(
      table.userId,
      table.date,
      table.channel
    )
  })
)

// Type exports for TypeScript
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert

export type NotificationBatch = typeof notificationBatches.$inferSelect
export type NewNotificationBatch = typeof notificationBatches.$inferInsert

export type NotificationHistoryRecord = typeof notificationHistory.$inferSelect
export type NewNotificationHistoryRecord =
  typeof notificationHistory.$inferInsert

export type NotificationStatsRecord = typeof notificationStats.$inferSelect
export type NewNotificationStatsRecord = typeof notificationStats.$inferInsert
