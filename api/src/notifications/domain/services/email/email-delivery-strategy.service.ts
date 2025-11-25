import { Inject, Injectable, Logger } from '@nestjs/common'
import { EMAIL_CLIENT } from 'src/notifications/tokens'
import { NotificationBatch } from '../../entities/notification-batch.entity'
import { Notification } from '../../entities/notification.entity'
import { NotificationDeliveryStrategy } from '../notification-delivery-strategy.interface'
import { EmailVendor } from './email-vendor.interface'

@Injectable()
export class EmailDeliveryStrategy implements NotificationDeliveryStrategy {
  private readonly logger = new Logger(EmailDeliveryStrategy.name)

  constructor(
    @Inject(EMAIL_CLIENT)
    private readonly emailVendor: EmailVendor
  ) {}

  async deliverSingle(notification: Notification): Promise<void> {
    try {
      this.logger.log(
        `[EMAIL] Sending single notification ${notification.id.value} to ${notification.recipientId.value}`
      )

      // Send email using the email vendor
      await this.emailVendor.send(notification)

      this.logger.log(
        `[EMAIL] Successfully sent notification ${notification.id.value}`
      )
    } catch (error) {
      this.logger.error(
        `[EMAIL] Failed to send notification ${notification.id.value}: ${error.message}`,
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
        `[EMAIL] Sending batch ${batch.id.value} with ${batch.notificationCount} notifications`
      )

      // Start processing the batch
      batch.startProcessing()

      // Send batch using the email vendor
      const result = await this.emailVendor.sendBatch(batch)

      this.logger.log(
        `[EMAIL] Batch ${batch.id.value} completed. Success: ${result.successEmails.length}, Failed: ${result.failedEmails.length}`
      )

      // If there were any failures, throw an error to indicate partial failure
      if (result.failedEmails.length > 0) {
        throw new Error(
          `Batch ${batch.id.value} completed with ${result.failedEmails.length} failures`
        )
      }
    } catch (error) {
      this.logger.error(
        `[EMAIL] Failed to send batch ${batch.id.value}: ${error.message}`,
        error.stack
      )

      // Mark all notifications in the batch as failed
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
