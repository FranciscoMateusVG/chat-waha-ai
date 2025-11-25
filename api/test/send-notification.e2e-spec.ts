import { Logger } from '@nestjs/common'
import { CqrsModule, EventBus } from '@nestjs/cqrs'
import { Test, TestingModule } from '@nestjs/testing'
import { SendIndividualNotificationDto } from '../src/notifications/application/dtos'
import { SendNotificationUseCase } from '../src/notifications/application/use-cases/send-notification.use-case'
import {
  NotificationFailedEvent,
  NotificationSentEvent
} from '../src/notifications/domain/events'
import { NotificationBatchRepository } from '../src/notifications/domain/repositories/notification-batch.repository.interface'
import { NotificationRepository } from '../src/notifications/domain/repositories/notification.repository.interface'
import {
  EmailDeliveryStrategy,
  WhatsAppDeliveryStrategy
} from '../src/notifications/domain/services'
import { NotificationChannelType } from '../src/notifications/domain/value-objects'
import {
  NOTIFICATION_BATCH_REPOSITORY,
  NOTIFICATION_REPOSITORY
} from '../src/notifications/tokens'

describe('SendNotificationUseCase E2E', () => {
  let app: TestingModule
  let sendNotificationUseCase: SendNotificationUseCase
  let mockNotificationRepository: jest.Mocked<NotificationRepository>
  let mockNotificationBatchRepository: jest.Mocked<NotificationBatchRepository>
  let mockEmailStrategy: jest.Mocked<EmailDeliveryStrategy>
  let mockWhatsAppStrategy: jest.Mocked<WhatsAppDeliveryStrategy>
  let mockEventBus: jest.Mocked<EventBus>

  beforeEach(async () => {
    // Create mocks
    mockNotificationRepository = {
      save: jest.fn(),
      saveMany: jest.fn(),
      findById: jest.fn(),
      findByRecipientId: jest.fn(),
      findByStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }

    mockNotificationBatchRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByStatus: jest.fn(),
      findByChannel: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }

    mockEmailStrategy = {
      deliverSingle: jest.fn(),
      deliverBatch: jest.fn(),
      supportsBatch: jest.fn().mockReturnValue(true)
    } as any

    mockWhatsAppStrategy = {
      deliverSingle: jest.fn(),
      deliverBatch: jest.fn(),
      supportsBatch: jest.fn().mockReturnValue(true)
    } as any

    mockEventBus = {
      publish: jest.fn()
    } as any

    // Create test module
    app = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        SendNotificationUseCase,
        {
          provide: NOTIFICATION_REPOSITORY,
          useValue: mockNotificationRepository
        },
        {
          provide: NOTIFICATION_BATCH_REPOSITORY,
          useValue: mockNotificationBatchRepository
        },
        {
          provide: EmailDeliveryStrategy,
          useValue: mockEmailStrategy
        },
        {
          provide: WhatsAppDeliveryStrategy,
          useValue: mockWhatsAppStrategy
        },
        {
          provide: EventBus,
          useValue: mockEventBus
        }
      ]
    }).compile()

    sendNotificationUseCase = app.get<SendNotificationUseCase>(
      SendNotificationUseCase
    )
  })

  afterEach(async () => {
    await app.close()
  })

  describe('sendIndividual', () => {
    const validEmailDto: SendIndividualNotificationDto = {
      title: 'Test Email',
      body: 'This is a test email notification',
      recipientId: 'user-123',
      channel: NotificationChannelType.EMAIL,
      metadata: { priority: 'high' },
      contactInfo: 'test@example.com'
    }

    const validWhatsAppDto: SendIndividualNotificationDto = {
      title: 'Test WhatsApp',
      body: 'This is a test WhatsApp notification',
      recipientId: 'user-456',
      channel: NotificationChannelType.WHATSAPP,
      metadata: { priority: 'normal' },
      contactInfo: '+1234567890'
    }

    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks()
    })

    describe('Success Cases', () => {
      it('should successfully send an email notification', async () => {
        // Arrange
        const mockNotification = {
          id: { value: 'notification-123' },
          getChannelStrategy: () => NotificationChannelType.EMAIL,
          markAsSent: jest.fn()
        }

        mockNotificationRepository.save.mockResolvedValue(undefined)
        mockEmailStrategy.deliverSingle.mockResolvedValue(undefined)
        mockNotificationRepository.update.mockResolvedValue(undefined)

        // Act
        const result =
          await sendNotificationUseCase.sendIndividual(validEmailDto)

        // Assert
        expect(result.success).toBe(true)
        expect(result.notificationId).toBeDefined()
        expect(result.error).toBeUndefined()

        // Verify repository calls
        expect(mockNotificationRepository.save).toHaveBeenCalledTimes(1)
        expect(mockNotificationRepository.update).toHaveBeenCalledTimes(1)

        // Verify strategy call
        expect(mockEmailStrategy.deliverSingle).toHaveBeenCalledTimes(1)
        expect(mockWhatsAppStrategy.deliverSingle).not.toHaveBeenCalled()

        // Verify event publishing
        expect(mockEventBus.publish).toHaveBeenCalledWith(
          expect.any(NotificationSentEvent)
        )
      })

      it('should successfully send a WhatsApp notification', async () => {
        // Arrange
        const mockNotification = {
          id: { value: 'notification-456' },
          getChannelStrategy: () => NotificationChannelType.WHATSAPP,
          markAsSent: jest.fn()
        }

        mockNotificationRepository.save.mockResolvedValue(undefined)
        mockWhatsAppStrategy.deliverSingle.mockResolvedValue(undefined)
        mockNotificationRepository.update.mockResolvedValue(undefined)

        // Act
        const result =
          await sendNotificationUseCase.sendIndividual(validWhatsAppDto)

        // Assert
        expect(result.success).toBe(true)
        expect(result.notificationId).toBeDefined()
        expect(result.error).toBeUndefined()

        // Verify strategy call
        expect(mockWhatsAppStrategy.deliverSingle).toHaveBeenCalledTimes(1)
        expect(mockEmailStrategy.deliverSingle).not.toHaveBeenCalled()

        // Verify event publishing
        expect(mockEventBus.publish).toHaveBeenCalledWith(
          expect.any(NotificationSentEvent)
        )
      })

      it('should handle notification with metadata correctly', async () => {
        // Arrange
        const dtoWithMetadata: SendIndividualNotificationDto = {
          ...validEmailDto,
          metadata: {
            priority: 'urgent',
            category: 'system',
            customField: 'customValue'
          }
        }

        mockNotificationRepository.save.mockResolvedValue(undefined)
        mockEmailStrategy.deliverSingle.mockResolvedValue(undefined)
        mockNotificationRepository.update.mockResolvedValue(undefined)

        // Act
        const result =
          await sendNotificationUseCase.sendIndividual(dtoWithMetadata)

        // Assert
        expect(result.success).toBe(true)
        expect(mockNotificationRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            content: expect.objectContaining({
              metadata: dtoWithMetadata.metadata
            })
          })
        )
      })
    })

    describe('Error Cases', () => {
      it('should handle missing contact info error', async () => {
        // Arrange
        const dtoWithoutContactInfo: SendIndividualNotificationDto = {
          ...validEmailDto,
          contactInfo: ''
        }

        // Act
        const result = await sendNotificationUseCase.sendIndividual(
          dtoWithoutContactInfo
        )

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid email format')
        expect(result.notificationId).toBeUndefined()

        // Verify no repository calls were made
        expect(mockNotificationRepository.save).not.toHaveBeenCalled()
        expect(mockNotificationRepository.update).not.toHaveBeenCalled()

        // Verify no strategy calls were made
        expect(mockEmailStrategy.deliverSingle).not.toHaveBeenCalled()
        expect(mockWhatsAppStrategy.deliverSingle).not.toHaveBeenCalled()
      })

      it('should handle invalid contact info validation error', async () => {
        // Arrange
        const dtoWithInvalidContactInfo: SendIndividualNotificationDto = {
          ...validEmailDto,
          contactInfo: 'invalid-email-format'
        }

        // Act
        const result = await sendNotificationUseCase.sendIndividual(
          dtoWithInvalidContactInfo
        )

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.notificationId).toBeUndefined()
      })

      it('should handle repository save error', async () => {
        // Arrange
        const saveError = new Error('Database connection failed')
        mockNotificationRepository.save.mockRejectedValue(saveError)

        // Act
        const result =
          await sendNotificationUseCase.sendIndividual(validEmailDto)

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe(saveError.message)
        expect(result.notificationId).toBeUndefined()

        // Verify no strategy calls were made
        expect(mockEmailStrategy.deliverSingle).not.toHaveBeenCalled()
      })

      it('should handle delivery strategy error', async () => {
        // Arrange
        const deliveryError = new Error('Email service unavailable')
        mockNotificationRepository.save.mockResolvedValue(undefined)
        mockEmailStrategy.deliverSingle.mockRejectedValue(deliveryError)

        // Act
        const result =
          await sendNotificationUseCase.sendIndividual(validEmailDto)

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe(deliveryError.message)
        expect(result.notificationId).toBeUndefined()

        // Verify repository was called
        expect(mockNotificationRepository.save).toHaveBeenCalledTimes(1)
        expect(mockNotificationRepository.update).not.toHaveBeenCalled()

        // Verify strategy was called
        expect(mockEmailStrategy.deliverSingle).toHaveBeenCalledTimes(1)
      })

      it('should handle unknown channel type error', async () => {
        // Arrange
        const dtoWithUnknownChannel: SendIndividualNotificationDto = {
          ...validEmailDto,
          channel: 'UNKNOWN_CHANNEL' as any
        }

        // Act
        const result = await sendNotificationUseCase.sendIndividual(
          dtoWithUnknownChannel
        )

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toContain(
          'Invalid notification channel: UNKNOWN_CHANNEL'
        )
        expect(result.notificationId).toBeUndefined()
      })

      it('should handle repository update error after successful delivery', async () => {
        // Arrange
        const updateError = new Error('Failed to update notification status')
        mockNotificationRepository.save.mockResolvedValue(undefined)
        mockEmailStrategy.deliverSingle.mockResolvedValue(undefined)
        mockNotificationRepository.update.mockRejectedValue(updateError)

        // Act
        const result =
          await sendNotificationUseCase.sendIndividual(validEmailDto)

        // Assert
        expect(result.success).toBe(false)
        expect(result.error).toBe(updateError.message)

        // Verify all calls were made
        expect(mockNotificationRepository.save).toHaveBeenCalledTimes(1)
        expect(mockEmailStrategy.deliverSingle).toHaveBeenCalledTimes(1)
        expect(mockNotificationRepository.update).toHaveBeenCalledTimes(1)
      })
    })

    describe('Domain Events', () => {
      it('should publish NotificationSentEvent on successful delivery', async () => {
        // Arrange
        mockNotificationRepository.save.mockResolvedValue(undefined)
        mockEmailStrategy.deliverSingle.mockResolvedValue(undefined)
        mockNotificationRepository.update.mockResolvedValue(undefined)

        // Act
        await sendNotificationUseCase.sendIndividual(validEmailDto)

        // Assert
        expect(mockEventBus.publish).toHaveBeenCalledTimes(1)
        expect(mockEventBus.publish).toHaveBeenCalledWith(
          expect.any(NotificationSentEvent)
        )
      })

      it('should not publish events on failure', async () => {
        // Arrange
        const saveError = new Error('Database error')
        mockNotificationRepository.save.mockRejectedValue(saveError)

        // Act
        await sendNotificationUseCase.sendIndividual(validEmailDto)

        // Assert
        expect(mockEventBus.publish).not.toHaveBeenCalled()
      })

      it('should publish NotificationFailedEvent when notification object is available in error', async () => {
        // Arrange
        const mockNotification = {
          id: { value: 'notification-123' },
          recipientId: { value: 'user-123' },
          channel: { value: 'email' },
          content: {
            title: 'Test Email',
            body: 'This is a test email notification'
          }
        }
        const deliveryError = new Error('Delivery failed') as any
        deliveryError.notification = mockNotification

        mockNotificationRepository.save.mockResolvedValue(undefined)
        mockEmailStrategy.deliverSingle.mockRejectedValue(deliveryError)

        // Act
        await sendNotificationUseCase.sendIndividual(validEmailDto)

        // Assert
        expect(mockEventBus.publish).toHaveBeenCalledWith(
          expect.any(NotificationFailedEvent)
        )
      })
    })

    describe('Logging', () => {
      it('should log appropriate messages during execution', async () => {
        // Arrange
        const loggerSpy = jest.spyOn(Logger.prototype, 'log')
        const errorSpy = jest.spyOn(Logger.prototype, 'error')

        mockNotificationRepository.save.mockResolvedValue(undefined)
        mockEmailStrategy.deliverSingle.mockResolvedValue(undefined)
        mockNotificationRepository.update.mockResolvedValue(undefined)

        // Act
        await sendNotificationUseCase.sendIndividual(validEmailDto)

        // Assert
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'Sending individual notification via email to user user-123'
          )
        )
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('Individual notification sent successfully')
        )

        // Cleanup
        loggerSpy.mockRestore()
        errorSpy.mockRestore()
      })

      it('should log errors appropriately', async () => {
        // Arrange
        const loggerSpy = jest.spyOn(Logger.prototype, 'log')
        const errorSpy = jest.spyOn(Logger.prototype, 'error')

        const saveError = new Error('Database error')
        mockNotificationRepository.save.mockRejectedValue(saveError)

        // Act
        await sendNotificationUseCase.sendIndividual(validEmailDto)

        // Assert
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to send individual notification'),
          expect.any(String)
        )

        // Cleanup
        loggerSpy.mockRestore()
        errorSpy.mockRestore()
      })
    })
  })
})
