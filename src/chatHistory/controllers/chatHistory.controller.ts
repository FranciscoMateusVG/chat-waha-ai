import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Query
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'
import {
  ApiResponseDto,
  ChatHistoryDto,
  ChatHistoryWithMessagesDto,
  ChatMessageDto
} from '../application/dtos/chat-history-response.dto'
import {
  PaginatedResponseDto,
  PaginationMetaDto,
  PaginationQueryDto
} from '../application/dtos/pagination.dto'
import { ChatHistoryRepository } from '../domain/repositories/chat-history.repository'
import { CHAT_HISTORY_REPOSITORY } from '../tokens'

@ApiTags('Chat History')
@Controller('chat-history')
export class ChatHistoryController {
  private readonly logger = new Logger(ChatHistoryController.name)

  constructor(
    @Inject(CHAT_HISTORY_REPOSITORY)
    private readonly chatHistoryRepository: ChatHistoryRepository
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get chat histories with pagination',
    description:
      'Retrieves chat histories (both open and closed) with pagination support'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number (1-indexed)',
    required: false,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page (max 100)',
    required: false,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of chat histories',
    type: PaginatedResponseDto
  })
  async getAllChatHistories(
    @Query() paginationQuery: PaginationQueryDto
  ): Promise<PaginatedResponseDto<ChatHistoryDto>> {
    try {
      const page = paginationQuery.page || 1
      const limit = paginationQuery.limit || 10

      const paginatedResult =
        await this.chatHistoryRepository.findAllChatHistoriesPaginated({
          page,
          limit
        })

      const chatHistoriesDto: ChatHistoryDto[] = paginatedResult.items.map(
        (chatHistory) => ({
          id: chatHistory.getId().value,
          externalChatId: chatHistory.getExternalChatId().value,
          chatName: chatHistory.getChatName(),
          status: chatHistory.getStatus().value,
          messageCount: chatHistory.getMessages().length,
          openedAt: chatHistory.getOpenedAt(),
          lastMessageAt: chatHistory.getLastMessageAt(),
          closedAt: chatHistory.getClosedAt(),
          isGroupChat: chatHistory.getIsGroupChat()
        })
      )

      const totalPages = Math.ceil(paginatedResult.total / limit)

      const meta: PaginationMetaDto = {
        currentPage: page,
        pageSize: limit,
        totalItems: paginatedResult.total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }

      return {
        success: true,
        data: chatHistoriesDto,
        meta
      }
    } catch (error) {
      this.logger.error('Error getting all chat histories', error.stack)
      throw new InternalServerErrorException(
        'Failed to retrieve chat histories'
      )
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get chat history with messages',
    description: 'Retrieves a specific chat history with all its messages'
  })
  @ApiParam({
    name: 'id',
    description: 'Chat history ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Chat history with messages',
    type: ApiResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Chat history not found'
  })
  async getChatHistoryById(
    @Param('id') id: string
  ): Promise<ApiResponseDto<ChatHistoryWithMessagesDto>> {
    try {
      const chatHistory =
        await this.chatHistoryRepository.findChatHistoryById(id)

      if (!chatHistory) {
        throw new NotFoundException(`Chat history with id ${id} not found`)
      }

      const messages: ChatMessageDto[] = chatHistory
        .getMessages()
        .map((message) => ({
          id: message.chatMessageId.value,
          content: message.messageContent.text,
          sender: message.messageSender.value,
          timestamp: message.messageTimestamp
        }))

      const chatHistoryDto: ChatHistoryWithMessagesDto = {
        id: chatHistory.getId().value,
        externalChatId: chatHistory.getExternalChatId().value,
        chatName: chatHistory.getChatName(),
        status: chatHistory.getStatus().value,
        messageCount: chatHistory.getMessages().length,
        openedAt: chatHistory.getOpenedAt(),
        lastMessageAt: chatHistory.getLastMessageAt(),
        closedAt: chatHistory.getClosedAt(),
        isGroupChat: chatHistory.getIsGroupChat(),
        messages: messages
      }

      return {
        success: true,
        data: chatHistoryDto
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error(`Error getting chat history ${id}`, error.stack)
      throw new InternalServerErrorException('Failed to retrieve chat history')
    }
  }

  @Get(':id/messages')
  @ApiOperation({
    summary: 'Get messages for a specific chat history',
    description: 'Retrieves all messages from a specific chat history'
  })
  @ApiParam({
    name: 'id',
    description: 'Chat history ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'List of messages',
    type: ApiResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Chat history not found'
  })
  async getMessages(
    @Param('id') id: string
  ): Promise<ApiResponseDto<ChatMessageDto[]>> {
    try {
      const chatHistory =
        await this.chatHistoryRepository.findChatHistoryById(id)

      if (!chatHistory) {
        throw new NotFoundException(`Chat history with id ${id} not found`)
      }

      const messages: ChatMessageDto[] = chatHistory
        .getMessages()
        .map((message) => ({
          id: message.chatMessageId.value,
          content: message.messageContent.text,
          sender: message.messageSender.value,
          timestamp: message.messageTimestamp
        }))

      return {
        success: true,
        data: messages
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error(
        `Error getting messages for chat history ${id}`,
        error.stack
      )
      throw new InternalServerErrorException('Failed to retrieve messages')
    }
  }

  @Patch(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Close a chat history',
    description: 'Changes the status of a chat history to closed'
  })
  @ApiParam({
    name: 'id',
    description: 'Chat history ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Chat history closed successfully',
    type: ApiResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Chat history not found'
  })
  @ApiBadRequestResponse({
    description: 'Chat is already closed'
  })
  async closeChatHistory(
    @Param('id') id: string
  ): Promise<ApiResponseDto<{ message: string }>> {
    try {
      const chatHistory =
        await this.chatHistoryRepository.findChatHistoryById(id)

      if (!chatHistory) {
        throw new NotFoundException(`Chat history with id ${id} not found`)
      }

      if (chatHistory.isChatClosed()) {
        return {
          success: false,
          error: 'Chat is already closed'
        }
      }

      chatHistory.closeChat()
      await this.chatHistoryRepository.save(chatHistory)

      this.logger.log(`Chat history ${id} closed successfully`)

      return {
        success: true,
        data: {
          message: 'Chat history closed successfully'
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error(`Error closing chat history ${id}`, error.stack)
      throw new InternalServerErrorException('Failed to close chat history')
    }
  }
}
