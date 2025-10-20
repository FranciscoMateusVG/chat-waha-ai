// src/chatHistory/infrastructure/webhooks/waha/waha-webhook.controller.ts

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post
} from '@nestjs/common'

import { isAiMessage } from 'src/ai/constants'
import { ReceiveWhatsAppMessageUseCase } from 'src/chatHistory/application/useCases/receive-whatsapp-message.use-case'
import { WhatsAppClientService } from 'src/infrastructure/waha/waha-client.service'
import { WAHAWebhookPayload } from './waha-payload.interface'
import { WAHAWebhookMapper } from './waha-webhook.mapper'

@Controller('webhooks/waha')
export class WAHAWebhookController {
  private readonly logger = new Logger(WAHAWebhookController.name)

  constructor(
    private readonly receiveMessageUseCase: ReceiveWhatsAppMessageUseCase,
    private readonly wahaClientService: WhatsAppClientService
  ) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  async handleMessage(@Body() payload: WAHAWebhookPayload): Promise<void> {
    this.logger.log(`Received WAHA webhook: ${payload.event}`)

    try {
      // 1. Filter events we care about
      if (!this.shouldProcessEvent(payload)) {
        this.logger.log(`Ignoring event: ${payload.event}`)
        return
      }

      // 2. Check for AI marker to prevent webhook loops
      const messageContent = payload.payload.body || ''
      if (isAiMessage(messageContent)) {
        this.logger.log(
          '✓ AI message detected and ignored (invisible marker found) - preventing webhook loop'
        )
        return
      } else {
        this.logger.log('Not an AI message sending to use case')
      }

      // 3. Validate payload (WAHA-specific)
      this.validatePayload(payload)

      // 4. Map WAHA payload → Generic DTO
      const dto = await WAHAWebhookMapper.toReceiveMessageDto(
        payload,
        this.wahaClientService
      )

      // 5. Call use case (generic, domain-agnostic)
      const result =
        await this.receiveMessageUseCase.receiveWhatsAppMessage(dto)

      if (!result.success) {
        this.logger.error(`Failed to process message: ${result.error}`)
      }
    } catch (error) {
      this.logger.error(
        `Error handling WAHA webhook: ${error.message}`,
        error.stack
      )

      this.logger.error(payload)
    }
  }

  private validatePayload(payload: WAHAWebhookPayload): void {
    if (!payload.event) {
      throw new Error('Missing event type')
    }

    if (!payload.payload?.body) {
      throw new Error('Missing message body')
    }

    if (!payload.payload?.from && !payload.payload?.to) {
      throw new Error('Missing chat information')
    }
  }

  private shouldProcessEvent(wahaPayload: WAHAWebhookPayload): boolean {
    // Only process actual messages, not system events
    const validEvents = ['message', 'message.any']

    if (!validEvents.includes(wahaPayload.event)) {
      return false
    }

    // Ignore messages with media for now
    if (wahaPayload.payload.hasMedia) {
      this.logger.log('Ignoring message with media')
      return false
    }

    // Ignore status@broadcast messages
    const { payload } = wahaPayload
    const externalChatId = payload.fromMe ? payload.to : payload.from
    if (externalChatId === 'status@broadcast') {
      this.logger.log('Ignoring status@broadcast message')
      return false
    }

    // Ignore empty messages
    if (
      !wahaPayload.payload.body ||
      wahaPayload.payload.body.trim().length === 0
    ) {
      return false
    }

    return true
  }
}
