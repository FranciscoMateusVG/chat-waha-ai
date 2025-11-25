import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Query
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger'
import {
  GetNotificationHistoryDto,
  GetNotificationStatsDto,
  SendBatchNotificationDto,
  SendIndividualNotificationDto
} from '../../application/dtos'
import {
  GetNotificationHistoryUseCase,
  SendNotificationUseCase
} from '../../application/use-cases'

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name)

  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getNotificationHistoryUseCase: GetNotificationHistoryUseCase
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send individual notification',
    description:
      'Send a notification to a single recipient via email, WhatsApp, or system channel'
  })
  @ApiBody({
    type: SendIndividualNotificationDto,
    description:
      'Notification details including recipient, channel, and content'
  })
  @ApiOkResponse({
    description: 'Notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        notificationId: { type: 'string', example: 'notif-123' },
        message: { type: 'string', example: 'Notification sent successfully' }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Failed to send notification' },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
  async sendIndividualNotification(@Body() dto: SendIndividualNotificationDto) {
    try {
      this.logger.log(
        `Sending individual notification via ${dto.channel} to user ${dto.recipientId}`
      )

      const result = await this.sendNotificationUseCase.sendIndividual(dto)

      if (!result.success) {
        throw new BadRequestException(result.error)
      }

      return {
        success: true,
        notificationId: result.notificationId,
        message: 'Notification sent successfully'
      }
    } catch (error) {
      this.logger.error(
        `Failed to send individual notification: ${error.message}`,
        error.stack
      )

      if (error instanceof BadRequestException) {
        throw error
      }

      throw new InternalServerErrorException('Failed to send notification')
    }
  }

  @Post('send/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send batch notification',
    description:
      'Send a notification to multiple recipients via email, WhatsApp, or system channel'
  })
  @ApiBody({
    type: SendBatchNotificationDto,
    description:
      'Batch notification details including recipients, channel, and content'
  })
  @ApiOkResponse({
    description: 'Batch notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        batchId: { type: 'string', example: 'batch-123' },
        recipientCount: { type: 'number', example: 5 },
        message: {
          type: 'string',
          example: 'Batch notification sent successfully'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: 'Failed to send batch notification'
        },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
  async sendBatchNotification(@Body() dto: SendBatchNotificationDto) {
    try {
      this.logger.log(
        `Sending batch notification via ${dto.channel} to ${dto.recipients.length} recipients`
      )

      const result = await this.sendNotificationUseCase.sendBatch(dto)

      if (!result.success) {
        throw new BadRequestException(result.error)
      }

      return {
        success: true,
        batchId: result.batchId,
        recipientCount: dto.recipients.length,
        message: 'Batch notification sent successfully'
      }
    } catch (error) {
      this.logger.error(
        `Failed to send batch notification: ${error.message}`,
        error.stack
      )

      if (error instanceof BadRequestException) {
        throw error
      }

      throw new InternalServerErrorException(
        'Failed to send batch notification'
      )
    }
  }

  @Get('history/recipient/:recipientId')
  @ApiOperation({
    summary: 'Get notification history by recipient',
    description:
      'Retrieve notification history for a specific recipient with optional filtering'
  })
  @ApiParam({
    name: 'recipientId',
    description: 'Unique identifier of the recipient',
    example: 'user-123'
  })
  @ApiQuery({
    name: 'channel',
    required: false,
    enum: ['system', 'whatsapp', 'email'],
    description: 'Filter by notification channel'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    description: 'Filter by notification status'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter notifications from this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter notifications until this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of notifications to return (1-100)',
    example: 20
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of notifications to skip',
    example: 0
  })
  @ApiOkResponse({
    description: 'Notification history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'notif-123' },
              title: { type: 'string', example: 'Welcome!' },
              body: { type: 'string', example: 'Welcome to our platform' },
              channel: { type: 'string', example: 'email' },
              status: { type: 'string', example: 'delivered' },
              createdAt: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z'
              },
              sentAt: { type: 'string', example: '2024-01-01T00:01:00.000Z' },
              deliveredAt: {
                type: 'string',
                example: '2024-01-01T00:02:00.000Z'
              }
            }
          }
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: 'Failed to get notification history'
        },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
  async getNotificationHistoryByRecipient(
    @Param('recipientId') recipientId: string,
    @Query() query: GetNotificationHistoryDto
  ) {
    try {
      this.logger.log(
        `Getting notification history for recipient: ${recipientId}`
      )

      const result = await this.getNotificationHistoryUseCase.getByRecipient(
        recipientId,
        query
      )

      return {
        success: true,
        data: result
      }
    } catch (error) {
      this.logger.error(
        `Failed to get notification history for recipient ${recipientId}: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(
        'Failed to get notification history'
      )
    }
  }

  @Get('history/channel/:channel')
  @ApiOperation({
    summary: 'Get notification history by channel',
    description:
      'Retrieve notification history for a specific channel with optional filtering'
  })
  @ApiParam({
    name: 'channel',
    description: 'Notification channel',
    enum: ['system', 'whatsapp', 'email'],
    example: 'email'
  })
  @ApiQuery({
    name: 'recipientId',
    required: false,
    type: String,
    description: 'Filter by specific recipient ID'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    description: 'Filter by notification status'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter notifications from this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter notifications until this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of notifications to return (1-100)',
    example: 20
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of notifications to skip',
    example: 0
  })
  @ApiOkResponse({
    description: 'Notification history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'notif-123' },
              title: { type: 'string', example: 'Welcome!' },
              body: { type: 'string', example: 'Welcome to our platform' },
              channel: { type: 'string', example: 'email' },
              status: { type: 'string', example: 'delivered' },
              recipientId: { type: 'string', example: 'user-123' },
              createdAt: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z'
              },
              sentAt: { type: 'string', example: '2024-01-01T00:01:00.000Z' },
              deliveredAt: {
                type: 'string',
                example: '2024-01-01T00:02:00.000Z'
              }
            }
          }
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: 'Failed to get notification history'
        },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
  async getNotificationHistoryByChannel(
    @Param('channel') channel: string,
    @Query() query: GetNotificationHistoryDto
  ) {
    try {
      this.logger.log(`Getting notification history for channel: ${channel}`)

      const result = await this.getNotificationHistoryUseCase.getByChannel(
        channel,
        query
      )

      return {
        success: true,
        data: result
      }
    } catch (error) {
      this.logger.error(
        `Failed to get notification history for channel ${channel}: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(
        'Failed to get notification history'
      )
    }
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get notification statistics',
    description:
      'Retrieve overall notification statistics with optional filtering'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter statistics from this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter statistics until this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @ApiOkResponse({
    description: 'Notification statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 1000 },
            sent: { type: 'number', example: 950 },
            delivered: { type: 'number', example: 900 },
            failed: { type: 'number', example: 50 },
            pending: { type: 'number', example: 0 }
          }
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: 'Failed to get notification statistics'
        },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
  async getNotificationStats(@Query() query: GetNotificationStatsDto) {
    try {
      this.logger.log('Getting notification statistics')

      const result = await this.getNotificationHistoryUseCase.getStats(query)

      return {
        success: true,
        data: result
      }
    } catch (error) {
      this.logger.error(
        `Failed to get notification stats: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException(
        'Failed to get notification statistics'
      )
    }
  }

  @Get('stats/channels')
  @ApiOperation({
    summary: 'Get channel-specific notification statistics',
    description:
      'Retrieve notification statistics broken down by channel with optional filtering'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter statistics from this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter statistics until this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @ApiOkResponse({
    description: 'Channel statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string', example: 'email' },
              total: { type: 'number', example: 500 },
              sent: { type: 'number', example: 480 },
              delivered: { type: 'number', example: 450 },
              failed: { type: 'number', example: 20 },
              pending: { type: 'number', example: 0 }
            }
          }
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: 'Failed to get channel statistics'
        },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
  async getChannelStats(@Query() query: GetNotificationStatsDto) {
    try {
      this.logger.log('Getting channel-specific notification statistics')

      const result =
        await this.getNotificationHistoryUseCase.getChannelStats(query)

      return {
        success: true,
        data: result
      }
    } catch (error) {
      this.logger.error(
        `Failed to get channel stats: ${error.message}`,
        error.stack
      )
      throw new InternalServerErrorException('Failed to get channel statistics')
    }
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the notification service is healthy and running'
  })
  @ApiOkResponse({
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Notification service is healthy' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  async getHealthCheck() {
    return {
      success: true,
      message: 'Notification service is healthy',
      timestamp: new Date().toISOString()
    }
  }
}
