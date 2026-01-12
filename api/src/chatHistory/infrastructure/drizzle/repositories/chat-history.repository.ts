import { Injectable, Logger } from '@nestjs/common'
import { and, count, desc, eq } from 'drizzle-orm'
import { WAHAExternalChatId } from 'src/chatHistory/application/useCases/receive-whatsapp-message.use-case'
import { ChatHistory } from 'src/chatHistory/domain/entities/chat-history'
import { ChatMessage } from 'src/chatHistory/domain/entities/chat-message'
import {
  ChatHistoryRepository,
  PaginatedResult,
  PaginationParams
} from 'src/chatHistory/domain/repositories/chat-history.repository'
import {
  ChatHistoryId,
  ChatMessageId,
  ChatStatus,
  ChatStatusType,
  MessageContent,
  MessageSender,
  MessageSenderType
} from 'src/chatHistory/domain/value-objects'
import { DrizzleDatabaseService } from 'src/infrastructure/drizzle/database.provider'
import {
  chatHistories,
  ChatHistoryInsert,
  ChatHistorySelect,
  ChatMessageInsert,
  chatMessages,
  ChatMessageSelect
} from 'src/infrastructure/drizzle/schemas/chatHistory/schema'

@Injectable()
export class DrizzleChatHistoryRepository implements ChatHistoryRepository {
  private readonly logger = new Logger(DrizzleChatHistoryRepository.name)

  constructor(private readonly databaseService: DrizzleDatabaseService) {}

  private get db() {
    return this.databaseService.getDatabase()
  }

  async findOpenChatHistoryByExternalChatId(
    userId: string,
    externalChatId: string
  ): Promise<ChatHistory | null> {
    try {
      // 1. Find the chat history for this user
      const chatHistoryRecord = await this.db
        .select()
        .from(chatHistories)
        .where(
          and(
            eq(chatHistories.userId, userId),
            eq(chatHistories.externalChatId, externalChatId),
            eq(chatHistories.status, 'open')
          )
        )
        .limit(1)

      if (chatHistoryRecord.length === 0) {
        return null
      }

      // 2. Load messages for this chat
      const messagesRecords = await this.db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatHistoryId, chatHistoryRecord[0].id))
        .orderBy(chatMessages.timestamp)

      // 3. Map to domain entity
      return this.mapToDomainEntity(chatHistoryRecord[0], messagesRecords)
    } catch (error) {
      this.logger.error(
        `Failed to find chat history: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  async findAllOpenChatHistories(userId: string): Promise<ChatHistory[]> {
    try {
      const chatHistoryRecords = await this.db
        .select()
        .from(chatHistories)
        .where(
          and(
            eq(chatHistories.userId, userId),
            eq(chatHistories.status, 'open')
          )
        )

      const result: ChatHistory[] = []

      for (const chatHistoryRecord of chatHistoryRecords) {
        const messagesRecords = await this.db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.chatHistoryId, chatHistoryRecord.id))
          .orderBy(chatMessages.timestamp)

        const chatHistory = this.mapToDomainEntity(
          chatHistoryRecord,
          messagesRecords
        )
        result.push(chatHistory)
      }

      return result
    } catch (error) {
      this.logger.error(
        `Failed to find all open chat histories: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  async findAllChatHistories(userId: string): Promise<ChatHistory[]> {
    try {
      const chatHistoryRecords = await this.db
        .select()
        .from(chatHistories)
        .where(eq(chatHistories.userId, userId))
        .orderBy(desc(chatHistories.lastMessageAt))

      const result: ChatHistory[] = []

      for (const chatHistoryRecord of chatHistoryRecords) {
        const messagesRecords = await this.db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.chatHistoryId, chatHistoryRecord.id))
          .orderBy(chatMessages.timestamp)

        const chatHistory = this.mapToDomainEntity(
          chatHistoryRecord,
          messagesRecords
        )
        result.push(chatHistory)
      }

      return result
    } catch (error) {
      this.logger.error(
        `Failed to find all chat histories: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  async findAllChatHistoriesPaginated(
    userId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<ChatHistory>> {
    try {
      const { page, limit } = params
      const offset = (page - 1) * limit

      // Get total count for this user
      const [{ count: totalCount }] = await this.db
        .select({ count: count() })
        .from(chatHistories)
        .where(eq(chatHistories.userId, userId))

      // Get paginated records for this user
      const chatHistoryRecords = await this.db
        .select()
        .from(chatHistories)
        .where(eq(chatHistories.userId, userId))
        .orderBy(desc(chatHistories.lastMessageAt))
        .limit(limit)
        .offset(offset)

      const result: ChatHistory[] = []

      for (const chatHistoryRecord of chatHistoryRecords) {
        const messagesRecords = await this.db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.chatHistoryId, chatHistoryRecord.id))
          .orderBy(chatMessages.timestamp)

        const chatHistory = this.mapToDomainEntity(
          chatHistoryRecord,
          messagesRecords
        )
        result.push(chatHistory)
      }

      return {
        items: result,
        total: totalCount,
        page,
        limit
      }
    } catch (error) {
      this.logger.error(
        `Failed to find paginated chat histories: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  async findChatHistoryById(
    userId: string,
    id: string
  ): Promise<ChatHistory | null> {
    try {
      const chatHistoryRecord = await this.db
        .select()
        .from(chatHistories)
        .where(
          and(
            eq(chatHistories.userId, userId),
            eq(chatHistories.id, id)
          )
        )
        .limit(1)

      if (chatHistoryRecord.length === 0) {
        return null
      }

      const messagesRecords = await this.db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatHistoryId, chatHistoryRecord[0].id))
        .orderBy(chatMessages.timestamp)

      return this.mapToDomainEntity(chatHistoryRecord[0], messagesRecords)
    } catch (error) {
      this.logger.error(
        `Failed to find chat history by id: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  async save(chatHistory: ChatHistory): Promise<void> {
    try {
      const chatHistoryData = this.mapChatHistoryToDb(chatHistory)
      const messagesData = this.mapMessagesToDb(chatHistory)

      await this.db.transaction(async (tx) => {
        // Upsert chat history
        await tx
          .insert(chatHistories)
          .values(chatHistoryData)
          .onConflictDoUpdate({
            target: chatHistories.id,
            set: {
              chatName: chatHistoryData.chatName,
              status: chatHistoryData.status,
              lastMessageSender: chatHistoryData.lastMessageSender,
              lastMessageAt: chatHistoryData.lastMessageAt,
              closedAt: chatHistoryData.closedAt,
              updatedAt: chatHistoryData.updatedAt
            }
          })

        // Delete + reinsert messages
        await tx
          .delete(chatMessages)
          .where(eq(chatMessages.chatHistoryId, chatHistory.getId().value))

        if (messagesData.length > 0) {
          await tx.insert(chatMessages).values(messagesData)
        }
      })

      this.logger.debug(`Chat history saved: ${chatHistory.getId().value}`)
    } catch (error) {
      this.logger.error(
        `Failed to save chat history: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  // System method for scheduler - finds all open chat histories across all users
  async findAllOpenChatHistoriesAcrossAllUsers(): Promise<ChatHistory[]> {
    try {
      const chatHistoryRecords = await this.db
        .select()
        .from(chatHistories)
        .where(eq(chatHistories.status, 'open'))

      const result: ChatHistory[] = []

      for (const chatHistoryRecord of chatHistoryRecords) {
        const messagesRecords = await this.db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.chatHistoryId, chatHistoryRecord.id))
          .orderBy(chatMessages.timestamp)

        const chatHistory = this.mapToDomainEntity(
          chatHistoryRecord,
          messagesRecords
        )
        result.push(chatHistory)
      }

      return result
    } catch (error) {
      this.logger.error(
        `Failed to find all open chat histories across all users: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  // ==================== MAPPING ====================

  private mapChatHistoryToDb(chatHistory: ChatHistory): ChatHistoryInsert {
    return {
      id: chatHistory.getId().value,
      userId: chatHistory.getUserId(),
      externalChatId: chatHistory.getExternalChatId().value,
      chatName: chatHistory.getChatName(),
      status: chatHistory.getStatus().value,
      lastMessageSender: chatHistory.getLastMessageSender().value,
      openedAt: chatHistory.getOpenedAt(),
      lastMessageAt: chatHistory.getLastMessageAt(),
      closedAt: chatHistory.getClosedAt() || null,
      updatedAt: new Date()
    }
  }

  private mapMessagesToDb(chatHistory: ChatHistory): Array<ChatMessageInsert> {
    return chatHistory.getMessages().map((message) => ({
      id: message.chatMessageId.value,
      chatHistoryId: chatHistory.getId().value,
      content: message.messageContent.text,
      sender: message.messageSender.value,
      mentionedAi: message.didMentionAi(message.messageContent),
      timestamp: message.messageTimestamp
    }))
  }

  private mapToDomainEntity(
    chatHistoryRecord: ChatHistorySelect,
    messagesRecords: ChatMessageSelect[]
  ): ChatHistory {
    const messages = messagesRecords.map(
      (messageRecord) =>
        new ChatMessage({
          id: new ChatMessageId(messageRecord.id),
          content: new MessageContent(messageRecord.content),
          sender: this.mapMessageSenderToDomain(messageRecord.sender),
          timestamp: messageRecord.timestamp
        })
    )

    return new ChatHistory({
      id: new ChatHistoryId(chatHistoryRecord.id),
      userId: chatHistoryRecord.userId,
      externalChatId: new WAHAExternalChatId(chatHistoryRecord.externalChatId),
      chatName: chatHistoryRecord.chatName,
      status: this.mapChatStatusToDomain(chatHistoryRecord.status),

      openedAt: chatHistoryRecord.openedAt,
      lastMessageAt: chatHistoryRecord.lastMessageAt,
      closedAt: chatHistoryRecord.closedAt || undefined,
      messages: messages
    })
  }

  private mapMessageSenderToDomain(sender: string): MessageSender {
    return new MessageSender(sender as MessageSenderType)
  }

  private mapChatStatusToDomain(status: string): ChatStatus {
    return new ChatStatus(status as ChatStatusType)
  }
}
