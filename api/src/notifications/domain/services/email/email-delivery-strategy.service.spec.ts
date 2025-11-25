import { Logger } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { EMAIL_CLIENT } from '../../../tokens'
import { BatchId, NotificationId, UserId } from '../../entities/ids'
import { NotificationBatch } from '../../entities/notification-batch.entity'
import { Notification } from '../../entities/notification.entity'
import {
  NotificationChannel,
  NotificationContent,
  NotificationStatus
} from '../../value-objects'
import { BatchStatus } from '../../value-objects/batch-status.vo'
import { EmailContactInfo } from '../../value-objects/email-contact-info.vo'
import { EmailDeliveryStrategy } from './email-delivery-strategy.service'
import { EmailVendor } from './email-vendor.interface'

describe('EmailDeliveryStrategy', () => {
  let service: EmailDeliveryStrategy
  let emailVendor: jest.Mocked<EmailVendor>
  let logger: jest.Mocked<Logger>

  const mockNotificationId = 'test-notification-id'
  const mockUserId = 'test-user-id'
  const mockBatchId = 'test-batch-id'

  beforeEach(async () => {
    const mockEmailVendor = {
      send: jest.fn(),
      sendBatch: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailDeliveryStrategy,
        {
          provide: EMAIL_CLIENT,
          useValue: mockEmailVendor
        }
      ]
    }).compile()

    service = module.get<EmailDeliveryStrategy>(EmailDeliveryStrategy)
    emailVendor = module.get(EMAIL_CLIENT)

    // Mock the logger
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    } as any

    // Replace the logger instance
    ;(service as any).logger = logger
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('deliverSingle', () => {
    let notification: Notification

    beforeEach(() => {
      notification = new Notification({
        id: new NotificationId(mockNotificationId),
        recipientId: new UserId(mockUserId),
        content: new NotificationContent('Test Title', 'Test Body'),
        channel: NotificationChannel.email(),
        contactInfo: new EmailContactInfo('test@example.com'),
        status: NotificationStatus.pending(),
        createdAt: new Date()
      })
    })

    it('should successfully deliver a single notification', async () => {
      // Arrange
      emailVendor.send.mockResolvedValue(undefined)

      // Act
      await service.deliverSingle(notification)

      // Assert
      expect(emailVendor.send).toHaveBeenCalledWith(notification)
      expect(notification.status.isSent()).toBe(true)
      expect(logger.log).toHaveBeenCalledWith(
        `[EMAIL] Sending single notification ${mockNotificationId} to ${mockUserId}`
      )
      expect(logger.log).toHaveBeenCalledWith(
        `[EMAIL] Successfully sent notification ${mockNotificationId}`
      )
    })

    it('should handle vendor send failure and mark notification as failed', async () => {
      // Arrange
      const errorMessage = 'Email service error'
      const error = new Error(errorMessage)
      emailVendor.send.mockRejectedValue(error)

      // Act & Assert
      await expect(service.deliverSingle(notification)).rejects.toThrow(
        errorMessage
      )

      expect(emailVendor.send).toHaveBeenCalledWith(notification)
      expect(notification.status.isFailed()).toBe(true)
      expect(notification.status.errorMessage).toBe(errorMessage)
      expect(logger.error).toHaveBeenCalledWith(
        `[EMAIL] Failed to send notification ${mockNotificationId}: ${errorMessage}`,
        error.stack
      )
    })

    it('should handle notification that cannot be sent', async () => {
      // Arrange
      const notification = new Notification({
        id: new NotificationId(mockNotificationId),
        recipientId: new UserId(mockUserId),
        content: new NotificationContent('Test Title', 'Test Body'),
        channel: NotificationChannel.email(),
        contactInfo: new EmailContactInfo('test@example.com'),
        status: NotificationStatus.sent(), // Already sent
        createdAt: new Date()
      })

      emailVendor.send.mockResolvedValue(undefined)

      // Act & Assert
      await expect(service.deliverSingle(notification)).rejects.toThrow(
        'Notification cannot be sent. Must be in pending state.'
      )
    })
  })

  describe('deliverBatch', () => {
    let batch: NotificationBatch
    let notifications: Notification[]

    beforeEach(() => {
      notifications = [
        new Notification({
          id: new NotificationId('notification-1'),
          recipientId: new UserId('user-1'),
          content: new NotificationContent('Title 1', 'Body 1'),
          channel: NotificationChannel.email(),
          contactInfo: new EmailContactInfo('user1@example.com'),
          status: NotificationStatus.pending(),
          createdAt: new Date()
        }),
        new Notification({
          id: new NotificationId('notification-2'),
          recipientId: new UserId('user-2'),
          content: new NotificationContent('Title 2', 'Body 2'),
          channel: NotificationChannel.email(),
          contactInfo: new EmailContactInfo('user2@example.com'),
          status: NotificationStatus.pending(),
          createdAt: new Date()
        }),
        new Notification({
          id: new NotificationId('notification-3'),
          recipientId: new UserId('user-3'),
          content: new NotificationContent('Title 3', 'Body 3'),
          channel: NotificationChannel.email(),
          contactInfo: new EmailContactInfo('user3@example.com'),
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
      // Arrange
      const mockResult = {
        successEmails: [notifications[0], notifications[1], notifications[2]],
        failedEmails: []
      }
      emailVendor.sendBatch.mockResolvedValue(mockResult)

      // Act
      await service.deliverBatch(batch)

      // Assert
      expect(batch.status.isCompleted()).toBe(true)
      expect(notifications.every((n) => n.status.isSent())).toBe(true)
      expect(emailVendor.sendBatch).toHaveBeenCalledWith(batch)
      expect(logger.log).toHaveBeenCalledWith(
        `[EMAIL] Sending batch ${mockBatchId} with 3 notifications`
      )
      expect(logger.log).toHaveBeenCalledWith(
        `[EMAIL] Batch ${mockBatchId} completed. Success: 3, Failed: 0`
      )
    })

    it('should handle partial failures in batch delivery', async () => {
      // Arrange
      const mockResult = {
        successEmails: [notifications[0], notifications[2]], // 2 successful
        failedEmails: [notifications[1]] // 1 failed
      }
      emailVendor.sendBatch.mockResolvedValue(mockResult)

      // Act & Assert
      await expect(service.deliverBatch(batch)).rejects.toThrow(
        `Batch ${mockBatchId} completed with 1 failures`
      )

      expect(batch.status.isFailed()).toBe(true)
      expect(notifications[0].status.isSent()).toBe(true)
      expect(notifications[1].status.isFailed()).toBe(true)
      expect(notifications[2].status.isSent()).toBe(true)
      expect(logger.log).toHaveBeenCalledWith(
        `[EMAIL] Batch ${mockBatchId} completed. Success: 2, Failed: 1`
      )
    })

    it('should handle complete batch failure', async () => {
      // Arrange
      const errorMessage = 'Email service unavailable'
      const error = new Error(errorMessage)
      emailVendor.sendBatch.mockRejectedValue(error)

      // Act & Assert
      await expect(service.deliverBatch(batch)).rejects.toThrow(errorMessage)

      expect(batch.status.isFailed()).toBe(true)
      expect(notifications.every((n) => n.status.isFailed())).toBe(true)
      expect(logger.error).toHaveBeenCalledWith(
        `[EMAIL] Failed to send batch ${mockBatchId}: ${errorMessage}`,
        error.stack
      )
    })

    it('should mark pending notifications as failed when batch fails', async () => {
      // Arrange
      const errorMessage = 'Batch processing error'
      const error = new Error(errorMessage)

      // Make one notification already sent
      notifications[0].markAsSent()

      emailVendor.sendBatch.mockRejectedValue(error)

      // Act & Assert
      await expect(service.deliverBatch(batch)).rejects.toThrow(errorMessage)

      expect(notifications[0].status.isSent()).toBe(true) // Already sent, should remain sent
      expect(notifications[1].status.isFailed()).toBe(true) // Should be marked as failed
      expect(notifications[2].status.isFailed()).toBe(true) // Should be marked as failed
    })

    it('should handle empty success and failed arrays', async () => {
      // Arrange
      const mockResult = {
        successEmails: [],
        failedEmails: []
      }
      emailVendor.sendBatch.mockResolvedValue(mockResult)

      // Act
      await service.deliverBatch(batch)

      // Assert
      expect(batch.status.isCompleted()).toBe(true)
      expect(notifications.every((n) => n.status.isPending())).toBe(true) // No status changes
      expect(logger.log).toHaveBeenCalledWith(
        `[EMAIL] Batch ${mockBatchId} completed. Success: 0, Failed: 0`
      )
    })

    it('should handle batch that cannot be processed', async () => {
      // Arrange
      const batch = new NotificationBatch({
        id: new BatchId(mockBatchId),
        channel: NotificationChannel.email(),
        notifications: [notifications[0]],
        status: BatchStatus.completed(), // Already completed
        createdAt: new Date()
      })

      // Act & Assert
      await expect(service.deliverBatch(batch)).rejects.toThrow(
        'Batch cannot be processed. Must be in pending state.'
      )
    })

    it('should handle very large batches efficiently', async () => {
      // Arrange - Create 10 notifications
      const largeNotifications = Array.from(
        { length: 10 },
        (_, i) =>
          new Notification({
            id: new NotificationId(`notification-${i + 1}`),
            recipientId: new UserId(`user-${i + 1}`),
            content: new NotificationContent(`Title ${i + 1}`, `Body ${i + 1}`),
            channel: NotificationChannel.email(),
            contactInfo: new EmailContactInfo(`user${i + 1}@example.com`),
            status: NotificationStatus.pending(),
            createdAt: new Date()
          })
      )

      const largeBatch = new NotificationBatch({
        id: new BatchId('large-batch-id'),
        channel: NotificationChannel.email(),
        notifications: largeNotifications,
        status: BatchStatus.pending(),
        createdAt: new Date()
      })

      const mockResult = {
        successEmails: largeNotifications,
        failedEmails: []
      }
      emailVendor.sendBatch.mockResolvedValue(mockResult)

      // Act
      await service.deliverBatch(largeBatch)

      // Assert
      expect(emailVendor.sendBatch).toHaveBeenCalledWith(largeBatch)
      expect(largeBatch.status.isCompleted()).toBe(true)
      expect(largeNotifications.every((n) => n.status.isSent())).toBe(true)
    })

    it('should handle concurrent batch processing', async () => {
      // Arrange
      const batch1 = new NotificationBatch({
        id: new BatchId('batch-1'),
        channel: NotificationChannel.email(),
        notifications: [notifications[0]],
        status: BatchStatus.pending(),
        createdAt: new Date()
      })

      const batch2 = new NotificationBatch({
        id: new BatchId('batch-2'),
        channel: NotificationChannel.email(),
        notifications: [notifications[1]],
        status: BatchStatus.pending(),
        createdAt: new Date()
      })

      const mockResult1 = {
        successEmails: [notifications[0]],
        failedEmails: []
      }
      const mockResult2 = {
        successEmails: [notifications[1]],
        failedEmails: []
      }

      emailVendor.sendBatch
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2)

      // Act
      await Promise.all([
        service.deliverBatch(batch1),
        service.deliverBatch(batch2)
      ])

      // Assert
      expect(batch1.status.isCompleted()).toBe(true)
      expect(batch2.status.isCompleted()).toBe(true)
      expect(emailVendor.sendBatch).toHaveBeenCalledTimes(2)
    })
  })

  describe('supportsBatch', () => {
    it('should return true', () => {
      expect(service.supportsBatch()).toBe(true)
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle vendor sendBatch returning null or undefined', async () => {
      // Arrange
      const notification = new Notification({
        id: new NotificationId(mockNotificationId),
        recipientId: new UserId(mockUserId),
        content: new NotificationContent('Test Title', 'Test Body'),
        channel: NotificationChannel.email(),
        contactInfo: new EmailContactInfo('test@example.com'),
        status: NotificationStatus.pending(),
        createdAt: new Date()
      })

      const batch = new NotificationBatch({
        id: new BatchId(mockBatchId),
        channel: NotificationChannel.email(),
        notifications: [notification],
        status: BatchStatus.pending(),
        createdAt: new Date()
      })

      // Mock sendBatch to return undefined (should not happen in real scenario)
      emailVendor.sendBatch.mockResolvedValue(undefined as any)

      // Act & Assert
      await expect(service.deliverBatch(batch)).rejects.toThrow()
    })

    it('should handle vendor sendBatch returning invalid result structure', async () => {
      // Arrange
      const notification = new Notification({
        id: new NotificationId(mockNotificationId),
        recipientId: new UserId(mockUserId),
        content: new NotificationContent('Test Title', 'Test Body'),
        channel: NotificationChannel.email(),
        contactInfo: new EmailContactInfo('test@example.com'),
        status: NotificationStatus.pending(),
        createdAt: new Date()
      })

      const batch = new NotificationBatch({
        id: new BatchId(mockBatchId),
        channel: NotificationChannel.email(),
        notifications: [notification],
        status: BatchStatus.pending(),
        createdAt: new Date()
      })

      // Mock sendBatch to return invalid structure
      emailVendor.sendBatch.mockResolvedValue({
        successEmails: null,
        failedEmails: null
      } as any)

      // Act & Assert
      await expect(service.deliverBatch(batch)).rejects.toThrow()
    })

    it('should handle notification status transition errors', async () => {
      // Arrange
      const notification = new Notification({
        id: new NotificationId(mockNotificationId),
        recipientId: new UserId(mockUserId),
        content: new NotificationContent('Test Title', 'Test Body'),
        channel: NotificationChannel.email(),
        contactInfo: new EmailContactInfo('test@example.com'),
        status: NotificationStatus.pending(),
        createdAt: new Date()
      })

      // Mock the notification to throw an error when marking as sent
      jest.spyOn(notification, 'markAsSent').mockImplementation(() => {
        throw new Error('Status transition error')
      })

      emailVendor.send.mockResolvedValue(undefined)

      // Act & Assert
      await expect(service.deliverSingle(notification)).rejects.toThrow(
        'Status transition error'
      )
    })

    it('should handle batch status transition errors', async () => {
      // Arrange
      const notification = new Notification({
        id: new NotificationId(mockNotificationId),
        recipientId: new UserId(mockUserId),
        content: new NotificationContent('Test Title', 'Test Body'),
        channel: NotificationChannel.email(),
        contactInfo: new EmailContactInfo('test@example.com'),
        status: NotificationStatus.pending(),
        createdAt: new Date()
      })

      const batch = new NotificationBatch({
        id: new BatchId(mockBatchId),
        channel: NotificationChannel.email(),
        notifications: [notification],
        status: BatchStatus.pending(),
        createdAt: new Date()
      })

      // Mock the batch to throw an error when starting processing
      jest.spyOn(batch, 'startProcessing').mockImplementation(() => {
        throw new Error('Batch status transition error')
      })

      // Act & Assert
      await expect(service.deliverBatch(batch)).rejects.toThrow(
        'Batch status transition error'
      )
    })

    it('should handle mixed notification statuses in batch result', async () => {
      // Arrange
      const notifications = [
        new Notification({
          id: new NotificationId('notification-1'),
          recipientId: new UserId('user-1'),
          content: new NotificationContent('Title 1', 'Body 1'),
          channel: NotificationChannel.email(),
          contactInfo: new EmailContactInfo('user1@example.com'),
          status: NotificationStatus.pending(),
          createdAt: new Date()
        }),
        new Notification({
          id: new NotificationId('notification-2'),
          recipientId: new UserId('user-2'),
          content: new NotificationContent('Title 2', 'Body 2'),
          channel: NotificationChannel.email(),
          contactInfo: new EmailContactInfo('user2@example.com'),
          status: NotificationStatus.pending(),
          createdAt: new Date()
        })
      ]

      const batch = new NotificationBatch({
        id: new BatchId(mockBatchId),
        channel: NotificationChannel.email(),
        notifications,
        status: BatchStatus.pending(),
        createdAt: new Date()
      })

      // Mock result with notifications that are already in different states
      const mockResult = {
        successEmails: [notifications[0]], // Will be marked as sent
        failedEmails: [notifications[1]] // Will be marked as failed
      }
      emailVendor.sendBatch.mockResolvedValue(mockResult)

      // Act
      await service.deliverBatch(batch)

      // Assert
      expect(notifications[0].status.isSent()).toBe(true)
      expect(notifications[1].status.isFailed()).toBe(true)
      expect(batch.status.isCompleted()).toBe(true)
    })
  })
})
