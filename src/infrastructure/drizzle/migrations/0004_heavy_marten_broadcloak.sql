CREATE TABLE `knowledge_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`topic` text NOT NULL,
	`key` text NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`metadata` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `knowledge_entries_key_unique` ON `knowledge_entries` (`key`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_type` ON `knowledge_entries` (`type`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_topic` ON `knowledge_entries` (`topic`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_key` ON `knowledge_entries` (`key`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_tags` ON `knowledge_entries` (`tags`);--> statement-breakpoint
CREATE INDEX `idx_knowledge_created_at` ON `knowledge_entries` (`created_at`);