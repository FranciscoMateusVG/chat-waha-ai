import { Injectable, Logger } from '@nestjs/common'
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
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'
import { ChatHistory as PrismaChatHistory, ChatMessage as PrismaChatMessage } from '@prisma/generated'

@Injectable()
export class PrismaChatHistoryRepository implements ChatHistoryRepository {
  private readonly logger = new Logger(PrismaChatHistoryRepository.name)

  constructor(private readonly prisma: PrismaService) {}

  async findOpenChatHistoryByExternalChatId(
    userId: string,
    externalChatId: string
  ): Promise<ChatHistory | null> {
    try {
      const chatHistoryRecord = await this.prisma.chatHistory.findFirst({
        where: {
          userId,
          externalChatId,
          status: 'open'
        },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          }
        }
      })

      if (!chatHistoryRecord) {
        return null
      }

      return this.mapToDomainEntity(chatHistoryRecord, chatHistoryRecord.messages)
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
      const chatHistoryRecords = await this.prisma.chatHistory.findMany({
        where: {
          userId,
          status: 'open'
        },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          }
        }
      })

      return chatHistoryRecords.map(record =>
        this.mapToDomainEntity(record, record.messages)
      )
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
      const chatHistoryRecords = await this.prisma.chatHistory.findMany({
        where: { userId },
        orderBy: { lastMessageAt: 'desc' },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          }
        }
      })

      return chatHistoryRecords.map(record =>
        this.mapToDomainEntity(record, record.messages)
      )
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
      const skip = (page - 1) * limit

      const [totalCount, chatHistoryRecords] = await Promise.all([
        this.prisma.chatHistory.count({ where: { userId } }),
        this.prisma.chatHistory.findMany({
          where: { userId },
          orderBy: { lastMessageAt: 'desc' },
          skip,
          take: limit,
          include: {
            messages: {
              orderBy: { timestamp: 'asc' }
            }
          }
        })
      ])

      const items = chatHistoryRecords.map(record =>
        this.mapToDomainEntity(record, record.messages)
      )

      return {
        items,
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
      const chatHistoryRecord = await this.prisma.chatHistory.findFirst({
        where: {
          userId,
          id
        },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          }
        }
      })

      if (!chatHistoryRecord) {
        return null
      }

      return this.mapToDomainEntity(chatHistoryRecord, chatHistoryRecord.messages)
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

      await this.prisma.$transaction(async (tx) => {
        // Upsert chat history
        await tx.chatHistory.upsert({
          where: { id: chatHistoryData.id },
          create: chatHistoryData,
          update: {
            chatName: chatHistoryData.chatName,
            status: chatHistoryData.status,
            lastMessageSender: chatHistoryData.lastMessageSender,
            lastMessageAt: chatHistoryData.lastMessageAt,
            closedAt: chatHistoryData.closedAt,
            updatedAt: new Date()
          }
        })

        // Delete existing messages
        await tx.chatMessage.deleteMany({
          where: { chatHistoryId: chatHistory.getId().value }
        })

        // Insert new messages
        if (messagesData.length > 0) {
          await tx.chatMessage.createMany({
            data: messagesData
          })
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

  async findAllOpenChatHistoriesAcrossAllUsers(): Promise<ChatHistory[]> {
    try {
      const chatHistoryRecords = await this.prisma.chatHistory.findMany({
        where: { status: 'open' },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' }
          }
        }
      })

      return chatHistoryRecords.map(record =>
        this.mapToDomainEntity(record, record.messages)
      )
    } catch (error) {
      this.logger.error(
        `Failed to find all open chat histories across all users: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  async delete(userId: string, id: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // First delete all messages (due to foreign key constraint)
        await tx.chatMessage.deleteMany({
          where: { chatHistoryId: id }
        })

        // Then delete the chat history
        await tx.chatHistory.deleteMany({
          where: {
            id,
            userId
          }
        })
      })

      this.logger.debug(`Chat history deleted: ${id}`)
    } catch (error) {
      this.logger.error(
        `Failed to delete chat history: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  // ==================== MAPPING ====================

  private mapChatHistoryToDb(chatHistory: ChatHistory) {
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

  private mapMessagesToDb(chatHistory: ChatHistory) {
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
    chatHistoryRecord: PrismaChatHistory,
    messagesRecords: PrismaChatMessage[]
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
