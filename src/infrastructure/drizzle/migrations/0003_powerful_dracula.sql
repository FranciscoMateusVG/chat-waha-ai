CREATE TABLE `chat_histories` (
	`id` text PRIMARY KEY NOT NULL,
	`external_chat_id` text NOT NULL,
	`chat_name` text NOT NULL,
	`status` text NOT NULL,
	`last_message_sender` text NOT NULL,
	`opened_at` integer NOT NULL,
	`last_message_at` integer NOT NULL,
	`closed_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_history_id` text NOT NULL,
	`content` text NOT NULL,
	`sender` text NOT NULL,
	`mentioned_ai` integer DEFAULT false NOT NULL,
	`timestamp` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`chat_history_id`) REFERENCES `chat_histories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_histories_external_chat_id_unique` ON `chat_histories` (`external_chat_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_histories_external_chat_id` ON `chat_histories` (`external_chat_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_histories_status` ON `chat_histories` (`status`);--> statement-breakpoint
CREATE INDEX `idx_chat_histories_last_message_at` ON `chat_histories` (`last_message_at`);--> statement-breakpoint
CREATE INDEX `idx_chat_histories_status_external` ON `chat_histories` (`status`,`external_chat_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_messages_chat_history_id` ON `chat_messages` (`chat_history_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_messages_timestamp` ON `chat_messages` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_chat_messages_sender` ON `chat_messages` (`sender`);--> statement-breakpoint
CREATE INDEX `idx_chat_messages_chat_timestamp` ON `chat_messages` (`chat_history_id`,`timestamp`);