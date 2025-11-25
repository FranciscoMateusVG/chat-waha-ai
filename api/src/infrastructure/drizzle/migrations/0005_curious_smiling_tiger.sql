CREATE TABLE `system_prompts` (
	`id` text PRIMARY KEY DEFAULT 'system-prompt' NOT NULL,
	`content` text NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
