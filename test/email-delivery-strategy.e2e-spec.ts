import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { Logger } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import {
  BatchId,
  NotificationId,
  UserId
} from 'src/notifications/domain/entities/ids'
import { NotificationBatch } from 'src/notifications/domain/entities/notification-batch.entity'
import { Notification } from 'src/notifications/domain/entities/notification.entity'
import { EmailDeliveryStrategy } from 'src/notifications/domain/services/email/email-delivery-strategy.service'
import { EmailVendor } from 'src/notifications/domain/services/email/email-vendor.interface'
import {
  NotificationChannel,
  NotificationContent,
  NotificationStatus
} from 'src/notifications/domain/value-objects'
import { BatchStatus } from 'src/notifications/domain/value-objects/batch-status.vo'
import { EmailContactInfo } from 'src/notifications/domain/value-objects/email-contact-info.vo'
import { EmailClientService } from 'src/notifications/infrastructure/external-services/mailtrap/mailtrap-client.service'
import { EMAIL_CLIENT } from 'src/notifications/tokens'

describe('EmailDeliveryStrategy Integration', () => {
  let app: TestingModule
  let service: EmailDeliveryStrategy
  let emailVendor: EmailVendor
  let logger: Logger

  // Test data
  const mockNotificationId = '550e8400-e29b-41d4-a716-446655440000'
  const mockUserId = '550e8400-e29b-41d4-a716-446655440001'
  const mockBatchId = '550e8400-e29b-41d4-a716-446655440002'
  const testEmail = 'test@example.com'

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailDeliveryStrategy,
        {
          provide: EMAIL_CLIENT,
          useClass: EmailClientService
        }
      ]
    }).compile()

    app = module
    service = module.get<EmailDeliveryStrategy>(EmailDeliveryStrategy)
    emailVendor = module.get<EmailVendor>(EMAIL_CLIENT)
    logger = new Logger(EmailDeliveryStrategy.name)
  })

  describe('deliverBatch Integration', () => {
    let batch: NotificationBatch
    let notifications: Notification[]

    beforeEach(() => {
      notifications = [
        new Notification({
          id: new NotificationId(mockNotificationId),
          recipientId: new UserId('integration-user-1'),
          content: new NotificationContent('Batch Title 1', 'Batch Body 1'),
          channel: NotificationChannel.email(),
          contactInfo: new EmailContactInfo('franciscomateusvg@gmail.com'),
          status: NotificationStatus.pending(),
          createdAt: new Date()
        }),
        new Notification({
          id: new NotificationId(mockNotificationId),
          recipientId: new UserId('integration-user-2'),
          content: new NotificationContent('Batch Title 2', 'Batch Body 2'),
          channel: NotificationChannel.email(),
          contactInfo: new EmailContactInfo('programa.incluir.eicis@gmail.com'),
          status: NotificationStatus.pending(),
          createdAt: new Date()
        }),
        new Notification({
          id: new NotificationId(mockNotificationId),
          recipientId: new UserId('integration-user-3'),
          content: new NotificationContent('Batch Title 3', 'Batch Body 3'),
          channel: NotificationChannel.email(),
          contactInfo: new EmailContactInfo('pessoas.incluir@gmail.com'),
          status: NotificationStatus.pending(),
          createdAt: new Date()
        })
      ]

      batch = new NotificationBatch({
        id: new BatchId(mockBatchId),
        channel: NotificationChannel.email(),
        notifications,
        status: BatchStatus.pending(),
        createdAt: new Date()
      })
    })

    it('should successfully deliver a batch of notifications', async () => {
      // Act - Actually send the emails through Mailtrap
      await service.deliverBatch(batch)

      // Assert - Check that the batch was processed
      expect(batch.status.isProcessing()).toBe(true)

      // Log success
      console.log('✅ Successfully sent batch of emails to:')
      notifications.forEach((notification) => {
        const contactInfo = notification.contactInfo as EmailContactInfo
        console.log(
          `  - ${contactInfo.format()}: ${notification.content.title}`
        )
      })
    })
  })
})
