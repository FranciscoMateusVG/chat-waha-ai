-- Auth tables migration
CREATE TABLE IF NOT EXISTS `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `password_hash` text NOT NULL,
  `name` text,
  `created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  `updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);
CREATE INDEX IF NOT EXISTS `idx_users_email` ON `users` (`email`);

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `token` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS `sessions_token_unique` ON `sessions` (`token`);
CREATE INDEX IF NOT EXISTS `idx_sessions_token` ON `sessions` (`token`);
CREATE INDEX IF NOT EXISTS `idx_sessions_user_id` ON `sessions` (`user_id`);

CREATE TABLE IF NOT EXISTS `whatsapp_accounts` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `name` text NOT NULL,
  `phone_number` text,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  `updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS `idx_whatsapp_accounts_user_id` ON `whatsapp_accounts` (`user_id`);
