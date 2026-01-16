import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'
import { ApiAuth } from '../../common/decorators/api-auth.decorator'
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
import { MessageContent } from '../domain/value-objects'
import { CHAT_HISTORY_REPOSITORY } from '../tokens'

const USER_ID_HEADER = 'x-user-id'

@ApiTags('Chat History')
@ApiAuth()
@ApiHeader({
  name: USER_ID_HEADER,
  description: 'User ID for multi-tenant isolation',
  required: true,
  example: 'user-123'
})
@Controller('chat-history')
export class ChatHistoryController {
  private readonly logger = new Logger(ChatHistoryController.name)

  constructor(
    @Inject(CHAT_HISTORY_REPOSITORY)
    private readonly chatHistoryRepository: ChatHistoryRepository
  ) {}

  private validateUserId(userId: string | undefined): string {
    if (!userId) {
      throw new BadRequestException('X-User-ID header is required')
    }
    return userId
  }

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
    @Headers(USER_ID_HEADER) userId: string,
    @Query() paginationQuery: PaginationQueryDto
  ): Promise<PaginatedResponseDto<ChatHistoryDto>> {
    try {
      const validUserId = this.validateUserId(userId)
      const page = paginationQuery.page || 1
      const limit = paginationQuery.limit || 10

      const paginatedResult =
        await this.chatHistoryRepository.findAllChatHistoriesPaginated(
          validUserId,
          { page, limit }
        )

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
    @Headers(USER_ID_HEADER) userId: string,
    @Param('id') id: string
  ): Promise<ApiResponseDto<ChatHistoryWithMessagesDto>> {
    try {
      const validUserId = this.validateUserId(userId)
      const chatHistory =
        await this.chatHistoryRepository.findChatHistoryById(validUserId, id)

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
    @Headers(USER_ID_HEADER) userId: string,
    @Param('id') id: string
  ): Promise<ApiResponseDto<ChatMessageDto[]>> {
    try {
      const validUserId = this.validateUserId(userId)
      const chatHistory =
        await this.chatHistoryRepository.findChatHistoryById(validUserId, id)

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
    @Headers(USER_ID_HEADER) userId: string,
    @Param('id') id: string
  ): Promise<ApiResponseDto<{ message: string }>> {
    try {
      const validUserId = this.validateUserId(userId)
      const chatHistory =
        await this.chatHistoryRepository.findChatHistoryById(validUserId, id)

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

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a chat history',
    description: 'Permanently deletes a chat history and all its messages'
  })
  @ApiParam({
    name: 'id',
    description: 'Chat history ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Chat history deleted successfully',
    type: ApiResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Chat history not found'
  })
  async deleteChatHistory(
    @Headers(USER_ID_HEADER) userId: string,
    @Param('id') id: string
  ): Promise<ApiResponseDto<{ message: string }>> {
    try {
      const validUserId = this.validateUserId(userId)
      const chatHistory =
        await this.chatHistoryRepository.findChatHistoryById(validUserId, id)

      if (!chatHistory) {
        throw new NotFoundException(`Chat history with id ${id} not found`)
      }

      await this.chatHistoryRepository.delete(validUserId, id)

      this.logger.log(`Chat history ${id} deleted successfully`)

      return {
        success: true,
        data: {
          message: 'Chat history deleted successfully'
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error(`Error deleting chat history ${id}`, error.stack)
      throw new InternalServerErrorException('Failed to delete chat history')
    }
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send a message as the owner',
    description: 'Adds a new message from the owner to the chat history'
  })
  @ApiParam({
    name: 'id',
    description: 'Chat history ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: ApiResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Chat history not found'
  })
  @ApiBadRequestResponse({
    description: 'Chat is closed or invalid message content'
  })
  async sendMessage(
    @Headers(USER_ID_HEADER) userId: string,
    @Param('id') id: string,
    @Body() body: { content: string }
  ): Promise<ApiResponseDto<{ message: string }>> {
    try {
      const validUserId = this.validateUserId(userId)

      if (!body.content || body.content.trim().length === 0) {
        throw new BadRequestException('Message content is required')
      }

      const chatHistory =
        await this.chatHistoryRepository.findChatHistoryById(validUserId, id)

      if (!chatHistory) {
        throw new NotFoundException(`Chat history with id ${id} not found`)
      }

      if (chatHistory.isChatClosed()) {
        throw new BadRequestException('Cannot send messages to a closed chat')
      }

      chatHistory.addOwnerMessage(new MessageContent(body.content.trim()))
      await this.chatHistoryRepository.save(chatHistory)

      this.logger.log(`Message sent to chat history ${id}`)

      return {
        success: true,
        data: {
          message: 'Message sent successfully'
        }
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      this.logger.error(`Error sending message to chat history ${id}`, error.stack)
      throw new InternalServerErrorException('Failed to send message')
    }
  }
}
