Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_histories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "external_chat_id" TEXT NOT NULL,
    "chat_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "last_message_sender" TEXT NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "chat_history_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "mentioned_ai" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_prompts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "contact_info" TEXT,
    "error_message" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_batches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notification_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_history" (
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "failed_reason" TEXT,

    CONSTRAINT "notification_history_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "notification_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "total_sent" INTEGER NOT NULL DEFAULT 0,
    "total_failed" INTEGER NOT NULL DEFAULT 0,
    "total_delivered" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "whatsapp_accounts_user_id_idx" ON "whatsapp_accounts"("user_id");

-- CreateIndex
CREATE INDEX "whatsapp_accounts_status_idx" ON "whatsapp_accounts"("status");

-- CreateIndex
CREATE INDEX "chat_histories_user_id_idx" ON "chat_histories"("user_id");

-- CreateIndex
CREATE INDEX "chat_histories_external_chat_id_idx" ON "chat_histories"("external_chat_id");

-- CreateIndex
CREATE INDEX "chat_histories_status_idx" ON "chat_histories"("status");

-- CreateIndex
CREATE INDEX "chat_histories_last_message_at_idx" ON "chat_histories"("last_message_at");

-- CreateIndex
CREATE INDEX "chat_histories_user_id_status_external_chat_id_idx" ON "chat_histories"("user_id", "status", "external_chat_id");

-- CreateIndex
CREATE INDEX "chat_messages_chat_history_id_idx" ON "chat_messages"("chat_history_id");

-- CreateIndex
CREATE INDEX "chat_messages_timestamp_idx" ON "chat_messages"("timestamp");

-- CreateIndex
CREATE INDEX "chat_messages_sender_idx" ON "chat_messages"("sender");

-- CreateIndex
CREATE INDEX "chat_messages_chat_history_id_timestamp_idx" ON "chat_messages"("chat_history_id", "timestamp");

-- CreateIndex
CREATE INDEX "knowledge_entries_user_id_idx" ON "knowledge_entries"("user_id");

-- CreateIndex
CREATE INDEX "knowledge_entries_type_idx" ON "knowledge_entries"("type");

-- CreateIndex
CREATE INDEX "knowledge_entries_topic_idx" ON "knowledge_entries"("topic");

-- CreateIndex
CREATE INDEX "knowledge_entries_key_idx" ON "knowledge_entries"("key");

-- CreateIndex
CREATE INDEX "knowledge_entries_created_at_idx" ON "knowledge_entries"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_entries_user_id_key_key" ON "knowledge_entries"("user_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "system_prompts_user_id_key" ON "system_prompts"("user_id");

-- CreateIndex
CREATE INDEX "system_prompts_user_id_idx" ON "system_prompts"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_idx" ON "notifications"("recipient_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_channel_idx" ON "notifications"("channel");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_batch_id_idx" ON "notifications"("batch_id");

-- CreateIndex
CREATE INDEX "notification_batches_user_id_idx" ON "notification_batches"("user_id");

-- CreateIndex
CREATE INDEX "notification_batches_status_idx" ON "notification_batches"("status");

-- CreateIndex
CREATE INDEX "notification_batches_channel_idx" ON "notification_batches"("channel");

-- CreateIndex
CREATE INDEX "notification_history_user_id_idx" ON "notification_history"("user_id");

-- CreateIndex
CREATE INDEX "notification_history_recipient_id_idx" ON "notification_history"("recipient_id");

-- CreateIndex
CREATE INDEX "notification_history_channel_idx" ON "notification_history"("channel");

-- CreateIndex
CREATE INDEX "notification_history_status_idx" ON "notification_history"("status");

-- CreateIndex
CREATE INDEX "notification_history_created_at_idx" ON "notification_history"("created_at");

-- CreateIndex
CREATE INDEX "notification_stats_user_id_idx" ON "notification_stats"("user_id");

-- CreateIndex
CREATE INDEX "notification_stats_date_idx" ON "notification_stats"("date");

-- CreateIndex
CREATE INDEX "notification_stats_channel_idx" ON "notification_stats"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_stats_user_id_date_channel_key" ON "notification_stats"("user_id", "date", "channel");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "whatsapp_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_histories" ADD CONSTRAINT "chat_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_history_id_fkey" FOREIGN KEY ("chat_history_id") REFERENCES "chat_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_prompts" ADD CONSTRAINT "system_prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_batches" ADD CONSTRAINT "notification_batches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_stats" ADD CONSTRAINT "notification_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

