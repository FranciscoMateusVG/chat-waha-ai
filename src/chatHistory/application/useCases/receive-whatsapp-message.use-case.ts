import { Inject, Injectable, Logger } from '@nestjs/common'
import { ChatHistory } from 'src/chatHistory/domain/entities/chat-history'
import { ChatHistoryRepository } from 'src/chatHistory/domain/repositories/chat-history.repository'
import {
  ExternalChatId,
  MessageContent,
  MessageSender,
  MessageSenderType
} from 'src/chatHistory/domain/value-objects'
import { CHAT_HISTORY_REPOSITORY } from 'src/chatHistory/tokens'
import { ReceiveWhatsAppMessageDto } from '../dtos/receive-whatsapp.dto'

export interface ReceiveWhatsAppMessageResult {
  success: boolean
  chatHistoryId?: string
  error?: string
}

// TODO: find a way to decouple this better

export class WAHAExternalChatId extends ExternalChatId {
  constructor(value: string) {
    super(value)
  }

  isGroupChat(): boolean {
    // string ends with @g.us
    return this.value.endsWith('@g.us')
  }
}

@Injectable()
export class ReceiveWhatsAppMessageUseCase {
  private readonly logger = new Logger(ReceiveWhatsAppMessageUseCase.name)

  constructor(
    @Inject(CHAT_HISTORY_REPOSITORY)
    private readonly chatHistoryRepository: ChatHistoryRepository
  ) {}

  async receiveWhatsAppMessage(
    dto: ReceiveWhatsAppMessageDto
  ): Promise<ReceiveWhatsAppMessageResult> {
    try {
      // Find chat history by external chat id, the repo makes sure to return only one open chat history
      const chatHistoryInDb =
        await this.chatHistoryRepository.findOpenChatHistoryByExternalChatId(
          dto.externalChatId
        )

      let chatHistory: ChatHistory = chatHistoryInDb
      let isNewChatHistory = false

      if (!chatHistory) {
        this.logger.log('No chat history found, creating new one')
        chatHistory = this.createNewChatHistory(dto)
        isNewChatHistory = true
      }

      if (chatHistory.shouldBeClosed()) {
        chatHistory.closeChat()
        await this.chatHistoryRepository.save(chatHistory)
        this.logger.log('Chat history should be closed, creating new one')
        chatHistory = this.createNewChatHistory(dto)
        isNewChatHistory = true
      }

      if (!isNewChatHistory) {
        this.logger.log('Chat history found, adding message to chat history')
        this.handleAddMessage(chatHistory, dto)
      }

      await this.chatHistoryRepository.save(chatHistory)

      return {
        success: true,
        chatHistoryId: chatHistory.getId().value
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  private createNewChatHistory(dto: ReceiveWhatsAppMessageDto) {
    const externalChatId = new WAHAExternalChatId(dto.externalChatId)
    const newChatHistory = ChatHistory.create(
      externalChatId,
      dto.chatName,
      new MessageContent(dto.message),
      new MessageSender(dto.sender)
    )
    return newChatHistory
  }

  private handleAddMessage(
    chatHistory: ChatHistory,
    dto: ReceiveWhatsAppMessageDto
  ) {
    switch (dto.sender) {
      case MessageSenderType.USER:
        chatHistory.addUserMessage(new MessageContent(dto.message))
        break
      case MessageSenderType.AI:
        chatHistory.addAiMessage(new MessageContent(dto.message))
        break
      case MessageSenderType.OWNER:
        chatHistory.addOwnerMessage(new MessageContent(dto.message))
        break
      case MessageSenderType.SYSTEM:
        chatHistory.addSystemMessage(new MessageContent(dto.message))
        break
      default:
        throw new Error('Invalid message sender type - ' + dto.sender)
    }
  }
}
