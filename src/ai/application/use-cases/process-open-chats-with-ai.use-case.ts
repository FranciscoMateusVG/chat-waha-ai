import { Inject, Injectable, Logger } from '@nestjs/common'
import { ChatHistory } from 'src/chatHistory/domain/entities/chat-history'
import { MessageContent } from 'src/chatHistory/domain/value-objects'
import { WhatsAppClientService } from 'src/infrastructure/waha/waha-client.service'
import { notificationFactory } from 'src/notifications/factories/notification.factory'
import { ChatHistoryRepository } from '../../../chatHistory/domain/repositories/chat-history.repository'
import { MessageSenderType } from '../../../chatHistory/domain/value-objects/message-sender.vo'
import { CHAT_HISTORY_REPOSITORY } from '../../../chatHistory/tokens'
import { NotificationChannelType } from '../../../notifications/domain/value-objects'
import { markAsAiMessage } from '../../constants'
import {
  AiMessage,
  AiService
} from '../../infrastructure/services/ai.service.interface'
import { AI_SERVICE } from '../../tokens'

export interface ProcessOpenChatsResult {
  totalProcessed: number
  successful: number
  failed: number
  errors: string[]
}

@Injectable()
export class ProcessOpenChatsWithAiUseCase {
  private readonly logger = new Logger(ProcessOpenChatsWithAiUseCase.name)

  constructor(
    @Inject(CHAT_HISTORY_REPOSITORY)
    private readonly chatHistoryRepository: ChatHistoryRepository,
    @Inject(AI_SERVICE)
    private readonly aiService: AiService,
    private readonly whatsAppClientService: WhatsAppClientService
  ) {}

  async execute(): Promise<ProcessOpenChatsResult> {
    this.logger.log('Starting to process open chats with AI')

    const result: ProcessOpenChatsResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      errors: []
    }

    try {
      // Find all open chats
      const openChats =
        await this.chatHistoryRepository.findAllOpenChatHistories()
      this.logger.log(`Found ${openChats.length} open chats`)

      // Filter chats that need AI response
      const chatsNeedingResponse = openChats.filter((chat) =>
        chat.needsAiResponse()
      )

      this.logger.log(`${chatsNeedingResponse.length} chats need AI response`)

      result.totalProcessed = chatsNeedingResponse.length

      // Process each chat independently
      for (const chat of chatsNeedingResponse) {
        try {
          await this.processChat(chat)
          result.successful++
          this.logger.log(`Successfully processed chat ${chat.getId().value}`)
        } catch (error) {
          result.failed++
          const errorMessage = `Failed to process chat ${chat.getId().value}: ${error.message}`
          result.errors.push(errorMessage)
          this.logger.error(errorMessage, error.stack)
        }
      }

      this.logger.log(
        `Completed processing: ${result.successful} successful, ${result.failed} failed`
      )

      return result
    } catch (error) {
      this.logger.error(
        `Critical error in process open chats: ${error.message}`,
        error.stack
      )
      result.errors.push(`Critical error: ${error.message}`)
      return result
    }
  }

  private async processChat(chatHistory: ChatHistory): Promise<void> {
    const chatId = chatHistory.getId().value
    const externalChatId = chatHistory.getExternalChatId().value

    this.logger.log(`Processing chat ${chatId}`)

    // Get chat history and build context for AI
    const messages = chatHistory.getMessages()
    const context = this.buildAiContext(messages)

    this.logger.log(
      `Built context with ${context.length} messages for chat ${chatId}`
    )

    // Call AI service to generate response
    const aiResponse = await this.aiService.generateResponse(context)

    this.logger.log(
      `AI generated response for chat ${chatId}: ${aiResponse.substring(0, 100)}...`
    )

    chatHistory.addAiMessage(new MessageContent(aiResponse))

    await this.chatHistoryRepository.save(chatHistory)

    // Send notification via WhatsApp with AI marker to prevent webhook loops
    try {
      const dto = {
        recipientId: externalChatId,
        channel: NotificationChannelType.WHATSAPP,
        title: 'Incluir Zenão',
        body: markAsAiMessage(aiResponse), // Add invisible marker to prevent loops
        contactInfo: externalChatId,
        metadata: {
          chatId: chatId,
          timestamp: new Date().toISOString()
        }
      }

      const notification = notificationFactory(dto)

      await this.whatsAppClientService.send(notification)

      this.logger.log(`Sent WhatsApp notification for chat ${chatId}`)
    } catch (notificationError) {
      // Log notification error but don't fail the entire process
      this.logger.error(
        `Failed to send notification for chat ${chatId}: ${notificationError.message}`,
        notificationError.stack
      )
      // The AI response is already saved, so this is not a critical failure
    }
  }

  private buildAiContext(messages: any[]): AiMessage[] {
    const context = messages.map((message) => ({
      role: this.mapSenderToRole(message.messageSender.value),
      content: message.messageContent.text
    }))

    return context
  }

  private mapSenderToRole(
    sender: MessageSenderType
  ): 'user' | 'assistant' | 'system' {
    switch (sender) {
      case MessageSenderType.USER:
        return 'user'
      case MessageSenderType.AI:
        return 'assistant'
      case MessageSenderType.OWNER:
        return 'assistant' // Owner messages treated as assistant
      case MessageSenderType.SYSTEM:
        return 'system'
      default:
        return 'user'
    }
  }
}
