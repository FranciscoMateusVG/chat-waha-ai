CREATE TABLE `notification_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`status` text NOT NULL,
	`notification_count` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`processed_at` integer,
	`error_message` text,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notification_history` (
	`notification_id` text PRIMARY KEY NOT NULL,
	`recipient_id` text NOT NULL,
	`channel` text NOT NULL,
	`status` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`sent_at` integer,
	`failed_reason` text
);
--> statement-breakpoint
CREATE TABLE `notification_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`channel` text NOT NULL,
	`total_sent` integer DEFAULT 0 NOT NULL,
	`total_failed` integer DEFAULT 0 NOT NULL,
	`total_delivered` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`channel` text NOT NULL,
	`status` text NOT NULL,
	`metadata` text,
	`batch_id` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`sent_at` integer,
	`error_message` text,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
