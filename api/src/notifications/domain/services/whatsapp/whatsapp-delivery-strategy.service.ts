import { Inject, Injectable, Logger } from '@nestjs/common'
import { WHATSAPP_CLIENT } from 'src/notifications/tokens'
import { NotificationBatch } from '../../entities/notification-batch.entity'
import { Notification } from '../../entities/notification.entity'
import { NotificationDeliveryStrategy } from '../notification-delivery-strategy.interface'
import { RateLimiterService } from '../rate-limiter/rate-limiter.service'
import { WhatsappVendor } from './whatsApp-vendor.interface'

@Injectable()
export class WhatsAppDeliveryStrategy implements NotificationDeliveryStrategy {
  private readonly logger = new Logger(WhatsAppDeliveryStrategy.name)

  constructor(
    private readonly rateLimiter: RateLimiterService,
    @Inject(WHATSAPP_CLIENT)
    private readonly whatsappVendor: WhatsappVendor
  ) {}

  async deliverSingle(notification: Notification): Promise<void> {
    try {
      this.logger.log(
        `[WHATSAPP] Checking rate limit for single notification ${notification.id.value}`
      )

      this.logger.log(
        `[WHATSAPP] Sending single notification ${notification.id.value} to ${notification.recipientId.value}`
      )

      // Send WhatsApp message using the vendor
      await this.whatsappVendor.send(notification)

      this.logger.log(
        `[WHATSAPP] Successfully sent notification ${notification.id.value}`
      )
    } catch (error) {
      this.logger.error(
        `[WHATSAPP] Failed to send notification ${notification.id.value}: ${error.message}`,
        error.stack
      )

      // Mark notification as failed
      notification.markAsFailed(error.message)
      throw error
    }
  }

  async deliverBatch(batch: NotificationBatch): Promise<void> {
    try {
      this.logger.log(
        `[WHATSAPP] Sending batch ${batch.id.value} with ${batch.notificationCount} notifications`
      )

      // Start processing the batch
      batch.startProcessing()

      const CHUNK_SIZE = 3
      const CHUNK_DELAY_MS = 60000 // 1 minute between chunks

      // Split notifications into chunks for rate limiting
      const notifications = Array.from(batch.notifications)
      const chunks: Notification[][] = []

      for (let i = 0; i < notifications.length; i += CHUNK_SIZE) {
        chunks.push(notifications.slice(i, i + CHUNK_SIZE))
      }

      this.logger.log(
        `[WHATSAPP] Processing ${chunks.length} chunks of ${CHUNK_SIZE} notifications each`
      )

      let successCount = 0
      let failureCount = 0

      // Process each chunk with delay
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]

        this.logger.log(`[WHATSAPP] Processing chunk ${i + 1}/${chunks.length}`)

        // Send all notifications in current chunk
        for (const notification of chunk) {
          try {
            await this.rateLimiter.checkAndWaitIfNeeded('whatsapp')
            await this.whatsappVendor.send(notification)
            successCount++
          } catch (error) {
            this.logger.error(
              `[WHATSAPP] Failed to send notification ${notification.id.value} in chunk: ${error.message}`
            )
            notification.markAsFailed(error.message)
            failureCount++
          }
        }

        // Wait between chunks (except for the last chunk)
        if (i < chunks.length - 1) {
          this.logger.log(
            `[WHATSAPP] Waiting ${CHUNK_DELAY_MS / 1000} seconds before next chunk...`
          )
          await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY_MS))
        }
      }

      this.logger.log(
        `[WHATSAPP] Batch ${batch.id.value} completed. Success: ${successCount}, Failed: ${failureCount}`
      )

      // If there were any failures, throw an error to indicate partial failure
      if (failureCount > 0) {
        throw new Error(
          `Batch ${batch.id.value} completed with ${failureCount} failures`
        )
      }
    } catch (error) {
      this.logger.error(
        `[WHATSAPP] Failed to send batch ${batch.id.value}: ${error.message}`,
        error.stack
      )

      // Mark all pending notifications in the batch as failed
      batch.notifications.forEach((notification) => {
        if (notification.status.isPending()) {
          notification.markAsFailed(`Batch failed: ${error.message}`)
        }
      })

      // Mark batch as failed
      batch.markAsFailed(error.message)
      throw error
    }
  }

  supportsBatch(): boolean {
    return true
  }
}
