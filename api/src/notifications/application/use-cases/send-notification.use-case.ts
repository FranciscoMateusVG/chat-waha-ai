import { Inject, Injectable, Logger } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { Notification, NotificationBatch, UserId } from '../../domain/entities'
import {
  NotificationFailedEvent,
  NotificationSentEvent
} from '../../domain/events'
import {
  NotificationDeliveryStrategy,
  WhatsAppDeliveryStrategy
} from '../../domain/services'
import {
  NotificationChannel,
  NotificationChannelType,
  NotificationContent
} from '../../domain/value-objects'

import { NotificationBatchRepository } from 'src/notifications/domain/repositories/notification-batch.repository.interface'
import { NotificationRepository } from 'src/notifications/domain/repositories/notification.repository.interface'
import { WhatsappContactInfo } from 'src/notifications/domain/value-objects/whatsapp-contact-info.vo'
import {
  NOTIFICATION_BATCH_REPOSITORY,
  NOTIFICATION_REPOSITORY
} from '../../tokens'
import {
  SendBatchNotificationDto,
  SendIndividualNotificationDto
} from '../dtos'

export interface SendNotificationResult {
  success: boolean
  notificationId?: string
  batchId?: string
  error?: string
}

export const contactInfoMap = {
  [NotificationChannelType.WHATSAPP]: WhatsappContactInfo
}

@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger(SendNotificationUseCase.name)
  private readonly deliveryStrategies: Map<
    NotificationChannelType,
    NotificationDeliveryStrategy
  >

  constructor(
    private readonly eventBus: EventBus,
    private readonly whatsAppDeliveryStrategy: WhatsAppDeliveryStrategy,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
    @Inject(NOTIFICATION_BATCH_REPOSITORY)
    private readonly notificationBatchRepository: NotificationBatchRepository
  ) {
    this.deliveryStrategies = new Map([
      [NotificationChannelType.WHATSAPP, this.whatsAppDeliveryStrategy]
    ] as [NotificationChannelType, NotificationDeliveryStrategy][])
  }

  async sendMessage(
    dto: SendIndividualNotificationDto
  ): Promise<SendNotificationResult> {
    try {
      this.logger.log(
        `Sending individual notification via ${dto.channel} to user ${dto.recipientId}`
      )

      // Create domain objects
      const recipientId = new UserId(dto.recipientId)
      const content = new NotificationContent(dto.title, dto.body, dto.metadata)
      const channel = new NotificationChannel(dto.channel)
      const ContactInfoClass = contactInfoMap[dto.channel]
      const contactInfo = ContactInfoClass
        ? new ContactInfoClass(dto.contactInfo)
        : null

      if (!contactInfo) {
        throw new Error('Contact info is required for channel: ' + dto.channel)
      }

      contactInfo.validate()

      // Create notification aggregate
      const notification = Notification.create(
        recipientId,
        content,
        channel,
        contactInfo
      )

      await this.notificationRepository.save(notification)

      // Get delivery strategy
      const channelStrategy = notification.getChannelStrategy()
      const strategy = this.deliveryStrategies.get(channelStrategy)
      if (!strategy) {
        throw new Error(
          `No delivery strategy found for channel: ${channelStrategy}`
        )
      }

      // Deliver notification
      await strategy.deliverSingle(notification)
      notification.markAsSent()
      await this.notificationRepository.update(notification)

      // Emit domain event
      this.eventBus.publish(new NotificationSentEvent(notification))

      this.logger.log(
        `Individual notification sent successfully: ${notification.id.value}`
      )

      return {
        success: true,
        notificationId: notification.id.value
      }
    } catch (error) {
      this.logger.error(
        `Failed to send individual notification: ${error.message}`,
        error.stack
      )

      // Try to emit failure event if we have enough information
      if (error.notification) {
        this.eventBus.publish(
          new NotificationFailedEvent(
            error.notification,
            error?.message || 'Unknown error',
            new Date()
          )
        )
      }

      return {
        success: false,
        error: error?.message || 'Unknown error'
      }
    }
  }

  async sendBatchMessages(
    dto: SendBatchNotificationDto
  ): Promise<SendNotificationResult> {
    try {
      this.logger.log(
        `Sending batch notification via ${dto.channel} to ${dto.recipients.length} recipients`
      )

      // Create domain objects
      const content = new NotificationContent(dto.title, dto.body, dto.metadata)
      const channel = new NotificationChannel(dto.channel)

      // Create notification entities for each recipient
      const notifications = dto.recipients.map((recipient) => {
        const recipientId = new UserId(recipient.id)

        const ContactInfoClass = contactInfoMap[dto.channel]

        if (!ContactInfoClass) {
          throw new Error(
            'Contact info class not found for channel: ' + dto.channel
          )
        }

        if (!recipient.contactInfo) {
          throw new Error(
            'Contact info is required- missing for recipient: ' + recipient.id
          )
        }

        const contactInfo = new ContactInfoClass(recipient.contactInfo)

        return Notification.create(recipientId, content, channel, contactInfo)
      })

      // Create batch aggregate
      const batch = NotificationBatch.create(channel, notifications)
      await this.notificationBatchRepository.save(batch)

      // Get delivery strategy
      const strategy = this.deliveryStrategies.get(dto.channel)
      if (!strategy) {
        throw new Error(
          `No delivery strategy found for channel: ${dto.channel}`
        )
      }

      // Check if strategy supports batch delivery
      if (!strategy.supportsBatch()) {
        this.logger.warn(
          `Channel ${dto.channel} doesn't support batch delivery`
        )
        return
      }

      // 🔥 Fire and forget - process in background
      this.processBatchInBackground(batch, strategy).catch((error) => {
        this.logger.error(
          `Background batch processing failed for batch ${batch.id.value}: ${error.message}`,
          error.stack
        )
      })

      this.logger.log(
        `Batch ${batch.id.value} accepted for processing with ${notifications.length} notifications`
      )

      return {
        success: true,
        batchId: batch.id.value
      }
    } catch (error) {
      this.logger.error(
        `Failed to send batch notification: ${error.message}`,
        error.stack
      )

      return {
        success: false,
        error: error.message
      }
    }
  }

  // 🆕 private method to handle background processing
  private async processBatchInBackground(
    batch: NotificationBatch,
    strategy: NotificationDeliveryStrategy
  ): Promise<void> {
    try {
      this.logger.log(
        `[BACKGROUND] Starting batch processing for ${batch.id.value}`
      )

      // Use batch delivery (this might take a long time with rate limiting)
      await strategy.deliverBatch(batch)

      // Emit individual events for each notification
      for (const notification of batch.notifications) {
        notification.markAsSent()
        await this.notificationRepository.update(notification)
        this.eventBus.publish(new NotificationSentEvent(notification))
      }

      batch.markAsCompleted()
      await this.notificationBatchRepository.update(batch)

      this.logger.log(
        `[BACKGROUND] Batch ${batch.id.value} completed successfully`
      )
    } catch (error) {
      this.logger.error(
        `[BACKGROUND] Failed to process batch ${batch.id.value}: ${error.message}`,
        error.stack
      )

      // Mark batch as failed
      batch.markAsFailed(error.message)
      await this.notificationBatchRepository.update(batch)

      // Emit failure events for notifications that weren't sent
      for (const notification of batch.notifications) {
        if (notification.status.isPending()) {
          notification.markAsFailed(`Batch processing failed: ${error.message}`)
          await this.notificationRepository.update(notification)
          this.eventBus.publish(
            new NotificationFailedEvent(notification, error.message, new Date())
          )
        }
      }

      throw error // Re-throw so the catch handler logs it
    }
  }
}
