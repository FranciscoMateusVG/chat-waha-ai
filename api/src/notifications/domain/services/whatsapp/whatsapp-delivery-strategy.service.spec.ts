import { Logger } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { WHATSAPP_CLIENT } from '../../../tokens'
import { BatchId, NotificationId, UserId } from '../../entities/ids'
import { NotificationBatch } from '../../entities/notification-batch.entity'
import { Notification } from '../../entities/notification.entity'
import {
  NotificationChannel,
  NotificationContent,
  NotificationStatus
} from '../../value-objects'
import { BatchStatus } from '../../value-objects/batch-status.vo'
import { WhatsappContactInfo } from '../../value-objects/whatsapp-contact-info.vo'
import { RateLimiterService } from '../rate-limiter/rate-limiter.service'
import { WhatsAppDeliveryStrategy } from './whatsapp-delivery-strategy.service'
import { WhatsappVendor } from './whatsApp-vendor.interface'

describe('WhatsAppDeliveryStrategy', () => {
  let service: WhatsAppDeliveryStrategy
  let rateLimiterService: jest.Mocked<RateLimiterService>
  let whatsappVendor: jest.Mocked<WhatsappVendor>
  let logger: jest.Mocked<Logger>

  const mockNotificationId = 'test-notification-id'
  const mockUserId = 'test-user-id'
  const mockBatchId = 'test-batch-id'

  beforeEach(async () => {
    const mockRateLimiterService = {
      checkAndWaitIfNeeded: jest.fn()
    }

    const mockWhatsappVendor = {
      send: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppDeliveryStrategy,
        {
          provide: RateLimiterService,
          useValue: mockRateLimiterService
        },
        {
          provide: WHATSAPP_CLIENT,
          useValue: mockWhatsappVendor
        }
      ]
    }).compile()

    service = module.get<WhatsAppDeliveryStrategy>(WhatsAppDeliveryStrategy)
    rateLimiterService = module.get(RateLimiterService)
    whatsappVendor = module.get(WHATSAPP_CLIENT)

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
        channel: NotificationChannel.whatsapp(),
        contactInfo: new WhatsappContactInfo('+1234567890'),
        status: NotificationStatus.pending(),
        createdAt: new Date()
      })
    })

    it('should successfully deliver a single notification', async () => {
      // Arrange
      whatsappVendor.send.mockResolvedValue(undefined)
      rateLimiterService.checkAndWaitIfNeeded.mockResolvedValue(undefined)

      // Act
      await service.deliverSingle(notification)

      // Assert
      expect(rateLimiterService.checkAndWaitIfNeeded).toHaveBeenCalledWith(
        'whatsapp'
      )
      expect(whatsappVendor.send).toHaveBeenCalledWith(notification)
      expect(notification.status.isSent()).toBe(true)
      expect(logger.log).toHaveBeenCalledWith(
        `[WHATSAPP] Checking rate limit for single notification ${mockNotificationId}`
      )
      expect(logger.log).toHaveBeenCalledWith(
        `[WHATSAPP] Sending single notification ${mockNotificationId} to ${mockUserId}`
      )
      expect(logger.log).toHaveBeenCalledWith(
        `[WHATSAPP] Successfully sent notification ${mockNotificationId}`
      )
    })

    it('should handle vendor send failure and mark notification as failed', async () => {
      // Arrange
      const errorMessage = 'WhatsApp API error'
      const error = new Error(errorMessage)
      whatsappVendor.send.mockRejectedValue(error)
      rateLimiterService.checkAndWaitIfNeeded.mockResolvedValue(undefined)

      // Act & Assert
      await expect(service.deliverSingle(notification)).rejects.toThrow(
        errorMessage
      )

      expect(whatsappVendor.send).toHaveBeenCalledWith(notification)
      expect(notification.status.isFailed()).toBe(true)
      expect(notification.status.errorMessage).toBe(errorMessage)
      expect(logger.error).toHaveBeenCalledWith(
        `[WHATSAPP] Failed to send notification ${mockNotificationId}: ${errorMessage}`,
        error.stack
      )
    })

    it('should handle rate limiter failure', async () => {
      // Arrange
      const errorMessage = 'Rate limit exceeded'
      const error = new Error(errorMessage)
      rateLimiterService.checkAndWaitIfNeeded.mockRejectedValue(error)

      // Act & Assert
      await expect(service.deliverSingle(notification)).rejects.toThrow(
        errorMessage
      )

      expect(rateLimiterService.checkAndWaitIfNeeded).toHaveBeenCalledWith(
        'whatsapp'
      )
      expect(whatsappVendor.send).not.toHaveBeenCalled()
      expect(notification.status.isFailed()).toBe(true)
    })

    it('should not call rate limiter for single notification delivery', async () => {
      // Arrange
      whatsappVendor.send.mockResolvedValue(undefined)

      // Act
      await service.deliverSingle(notification)

      // Assert
      expect(rateLimiterService.checkAndWaitIfNeeded).not.toHaveBeenCalled()
      expect(whatsappVendor.send).toHaveBeenCalledWith(notification)
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
          channel: NotificationChannel.whatsapp(),
          contactInfo: new WhatsappContactInfo('+1111111111'),
          status: NotificationStatus.pending(),
          createdAt: new Date()
        }),
        new Notification({
          id: new NotificationId('notification-2'),
          recipientId: new UserId('user-2'),
          content: new NotificationContent('Title 2', 'Body 2'),
          channel: NotificationChannel.whatsapp(),
          contactInfo: new WhatsappContactInfo('+2222222222'),
          status: NotificationStatus.pending(),
          createdAt: new Date()
        }),
        new Notification({
          id: new NotificationId('notification-3'),
          recipientId: new UserId('user-3'),
          content: new NotificationContent('Title 3', 'Body 3'),
          channel: NotificationChannel.whatsapp(),
          contactInfo: new WhatsappContactInfo('+3333333333'),
          status: NotificationStatus.pending(),
          createdAt: new Date()
        })
      ]

      batch = new NotificationBatch({
        id: new BatchId(mockBatchId),
        channel: NotificationChannel.whatsapp(),
        notifications,
        status: BatchStatus.pending(),
        createdAt: new Date()
      })
    })

    it('should successfully deliver a batch of notifications', async () => {
      // Arrange
      whatsappVendor.send.mockResolvedValue(undefined)
      rateLimiterService.checkAndWaitIfNeeded.mockResolvedValue(undefined)

      // Act
      await service.deliverBatch(batch)

      // Assert
      expect(batch.status.isCompleted()).toBe(true)
      expect(notifications.every((n) => n.status.isSent())).toBe(true)
      expect(rateLimiterService.checkAndWaitIfNeeded).toHaveBeenCalledTimes(3)
      expect(whatsappVendor.send).toHaveBeenCalledTimes(3)
      expect(logger.log).toHaveBeenCalledWith(
        `[WHATSAPP] Sending batch ${mockBatchId} with 3 notifications`
      )
      expect(logger.log).toHaveBeenCalledWith(
        `[WHATSAPP] Processing 1 chunks of 3 notifications each`
      )
      expect(logger.log).toHaveBeenCalledWith(
        `[WHATSAPP] Batch ${mockBatchId} completed. Success: 3, Failed: 0`
      )
    })

    it('should process notifications in chunks with delays', async () => {
      // Arrange - Create 5 notifications to test chunking (chunk size is 3)
      const largeBatchNotifications = Array.from(
        { length: 5 },
        (_, i) =>
          new Notification({
            id: new NotificationId(`notification-${i + 1}`),
            recipientId: new UserId(`user-${i + 1}`),
            content: new NotificationContent(`Title ${i + 1}`, `Body ${i + 1}`),
            channel: NotificationChannel.whatsapp(),
            contactInfo: new WhatsappContactInfo(`+${1111111111 + i}`),
            status: NotificationStatus.pending(),
            createdAt: new Date()
          })
      )

      const largeBatch = new NotificationBatch({
        id: new BatchId('large-batch-id'),
        channel: NotificationChannel.whatsapp(),
        notifications: largeBatchNotifications,
        status: BatchStatus.pending(),
        createdAt: new Date()
      })

      whatsappVendor.send.mockResolvedValue(undefined)
      rateLimiterService.checkAndWaitIfNeeded.mockResolvedValue(undefined)

      // Mock setTimeout to avoid actual delays in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback()
        return {} as any
      })

      // Act
      await service.deliverBatch(largeBatch)

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        `[WHATSAPP] Processing 2 chunks of 3 notifications each`
      )
      expect(logger.log).toHaveBeenCalledWith(`[WHATSAPP] Processing chunk 1/2`)
      expect(logger.log).toHaveBeenCalledWith(`[WHATSAPP] Processing chunk 2/2`)
      expect(logger.log).toHaveBeenCalledWith(
        `[WHATSAPP] Waiting 60 seconds before next chunk...`
      )

      // Restore setTimeout
      jest.restoreAllMocks()
    })

    it('should handle partial failures in batch delivery', async () => {
      // Arrange
      whatsappVendor.send
        .mockResolvedValueOnce(undefined) // First notification succeeds
        .mockRejectedValueOnce(new Error('WhatsApp API error')) // Second fails
        .mockResolvedValueOnce(undefined) // Third succeeds

      rateLimiterService.checkAndWaitIfNeeded.mockResolvedValue(undefined)

      // Act & Assert
      await expect(service.deliverBatch(batch)).rejects.toThrow(
        `Batch ${mockBatchId} completed with 1 failures`
      )

      expect(batch.status.isFailed()).toBe(true)
      expect(notifications[0].status.isSent()).toBe(true)
      expect(notifications[1].status.isFailed()).toBe(true)
      expect(notifications[2].status.isSent()).toBe(true)
      expect(logger.error).toHaveBeenCalledWith(
        `[WHATSAPP] Failed to send notification notification-2 in chunk: WhatsApp API error`
      )
    })

    it('should handle complete batch failure', async () => {
      // Arrange
      const errorMessage = 'Complete batch failure'
      const error = new Error(errorMessage)
      whatsappVendor.send.mockRejectedValue(error)
      rateLimiterService.checkAndWaitIfNeeded.mockRejectedValue(error)

      // Act & Assert
      await expect(service.deliverBatch(batch)).rejects.toThrow(errorMessage)

      expect(batch.status.isFailed()).toBe(true)
      expect(notifications.every((n) => n.status.isFailed())).toBe(true)
      expect(logger.error).toHaveBeenCalledWith(
        `[WHATSAPP] Failed to send batch ${mockBatchId}: ${errorMessage}`,
        error.stack
      )
    })

    it('should mark pending notifications as failed when batch fails', async () => {
      // Arrange
      const errorMessage = 'Batch processing error'
      const error = new Error(errorMessage)

      // Make one notification already sent
      notifications[0].markAsSent()

      whatsappVendor.send.mockRejectedValue(error)
      rateLimiterService.checkAndWaitIfNeeded.mockRejectedValue(error)

      // Act & Assert
      await expect(service.deliverBatch(batch)).rejects.toThrow(errorMessage)

      expect(notifications[0].status.isSent()).toBe(true) // Already sent, should remain sent
      expect(notifications[1].status.isFailed()).toBe(true) // Should be marked as failed
      expect(notifications[2].status.isFailed()).toBe(true) // Should be marked as failed
    })

    it('should call rate limiter for each notification in batch', async () => {
      // Arrange
      whatsappVendor.send.mockResolvedValue(undefined)
      rateLimiterService.checkAndWaitIfNeeded.mockResolvedValue(undefined)

      // Act
      await service.deliverBatch(batch)

      // Assert
      expect(rateLimiterService.checkAndWaitIfNeeded).toHaveBeenCalledTimes(3)
      expect(rateLimiterService.checkAndWaitIfNeeded).toHaveBeenCalledWith(
        'whatsapp'
      )
    })

    it('should handle empty batch gracefully', async () => {
      // Arrange
      const emptyBatch = new NotificationBatch({
        id: new BatchId('empty-batch-id'),
        channel: NotificationChannel.whatsapp(),
        notifications: [],
        status: BatchStatus.pending(),
        createdAt: new Date()
      })

      // Act & Assert
      await expect(service.deliverBatch(emptyBatch)).rejects.toThrow(
        'Batch must contain at least one notification'
      )
    })
  })

  describe('supportsBatch', () => {
    it('should return true', () => {
      expect(service.supportsBatch()).toBe(true)
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle notification that cannot be sent', async () => {
      // Arrange
      const notification = new Notification({
        id: new NotificationId(mockNotificationId),
        recipientId: new UserId(mockUserId),
        content: new NotificationContent('Test Title', 'Test Body'),
        channel: NotificationChannel.whatsapp(),
        contactInfo: new WhatsappContactInfo('+1234567890'),
        status: NotificationStatus.sent(), // Already sent
        createdAt: new Date()
      })

      whatsappVendor.send.mockResolvedValue(undefined)

      // Act & Assert
      await expect(service.deliverSingle(notification)).rejects.toThrow(
        'Notification cannot be sent. Must be in pending state.'
      )
    })

    it('should handle batch that cannot be processed', async () => {
      // Arrange
      const notification = new Notification({
        id: new NotificationId('notification-1'),
        recipientId: new UserId('user-1'),
        content: new NotificationContent('Title 1', 'Body 1'),
        channel: NotificationChannel.whatsapp(),
        contactInfo: new WhatsappContactInfo('+1111111111'),
        status: NotificationStatus.pending(),
        createdAt: new Date()
      })

      const batch = new NotificationBatch({
        id: new BatchId(mockBatchId),
        channel: NotificationChannel.whatsapp(),
        notifications: [notification],
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
            channel: NotificationChannel.whatsapp(),
            contactInfo: new WhatsappContactInfo(`+${1111111111 + i}`),
            status: NotificationStatus.pending(),
            createdAt: new Date()
          })
      )

      const largeBatch = new NotificationBatch({
        id: new BatchId('large-batch-id'),
        channel: NotificationChannel.whatsapp(),
        notifications: largeNotifications,
        status: BatchStatus.pending(),
        createdAt: new Date()
      })

      whatsappVendor.send.mockResolvedValue(undefined)
      rateLimiterService.checkAndWaitIfNeeded.mockResolvedValue(undefined)

      // Mock setTimeout to avoid actual delays
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback()
        return {} as any
      })

      // Act
      await service.deliverBatch(largeBatch)

      // Assert
      expect(rateLimiterService.checkAndWaitIfNeeded).toHaveBeenCalledTimes(10)
      expect(whatsappVendor.send).toHaveBeenCalledTimes(10)
      expect(largeBatch.status.isCompleted()).toBe(true)

      // Restore setTimeout
      jest.restoreAllMocks()
    })

    it('should handle concurrent batch processing', async () => {
      // Arrange
      const notification1 = new Notification({
        id: new NotificationId('notification-1'),
        recipientId: new UserId('user-1'),
        content: new NotificationContent('Title 1', 'Body 1'),
        channel: NotificationChannel.whatsapp(),
        contactInfo: new WhatsappContactInfo('+1111111111'),
        status: NotificationStatus.pending(),
        createdAt: new Date()
      })

      const notification2 = new Notification({
        id: new NotificationId('notification-2'),
        recipientId: new UserId('user-2'),
        content: new NotificationContent('Title 2', 'Body 2'),
        channel: NotificationChannel.whatsapp(),
        contactInfo: new WhatsappContactInfo('+2222222222'),
        status: NotificationStatus.pending(),
        createdAt: new Date()
      })

      const batch1 = new NotificationBatch({
        id: new BatchId('batch-1'),
        channel: NotificationChannel.whatsapp(),
        notifications: [notification1],
        status: BatchStatus.pending(),
        createdAt: new Date()
      })

      const batch2 = new NotificationBatch({
        id: new BatchId('batch-2'),
        channel: NotificationChannel.whatsapp(),
        notifications: [notification2],
        status: BatchStatus.pending(),
        createdAt: new Date()
      })

      whatsappVendor.send.mockResolvedValue(undefined)
      rateLimiterService.checkAndWaitIfNeeded.mockResolvedValue(undefined)

      // Act
      await Promise.all([
        service.deliverBatch(batch1),
        service.deliverBatch(batch2)
      ])

      // Assert
      expect(batch1.status.isCompleted()).toBe(true)
      expect(batch2.status.isCompleted()).toBe(true)
      expect(rateLimiterService.checkAndWaitIfNeeded).toHaveBeenCalledTimes(2)
    })
  })
})
