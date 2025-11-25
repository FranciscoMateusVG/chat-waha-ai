CREATE INDEX `idx_notification_batches_status` ON `notification_batches` (`status`);--> statement-breakpoint
CREATE INDEX `idx_notification_batches_channel` ON `notification_batches` (`channel`);--> statement-breakpoint
CREATE INDEX `idx_notification_history_recipient` ON `notification_history` (`recipient_id`);--> statement-breakpoint
CREATE INDEX `idx_notification_history_channel` ON `notification_history` (`channel`);--> statement-breakpoint
CREATE INDEX `idx_notification_history_status` ON `notification_history` (`status`);--> statement-breakpoint
CREATE INDEX `idx_notification_history_created_at` ON `notification_history` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_notification_stats_date` ON `notification_stats` (`date`);--> statement-breakpoint
CREATE INDEX `idx_notification_stats_channel` ON `notification_stats` (`channel`);--> statement-breakpoint
CREATE INDEX `idx_notification_stats_date_channel` ON `notification_stats` (`date`,`channel`);--> statement-breakpoint
CREATE INDEX `idx_notifications_recipient` ON `notifications` (`recipient_id`);--> statement-breakpoint
CREATE INDEX `idx_notifications_status` ON `notifications` (`status`);--> statement-breakpoint
CREATE INDEX `idx_notifications_channel` ON `notifications` (`channel`);--> statement-breakpoint
CREATE INDEX `idx_notifications_created_at` ON `notifications` (`created_at`);