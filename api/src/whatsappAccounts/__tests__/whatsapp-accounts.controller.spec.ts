import { Test, TestingModule } from '@nestjs/testing'
import { WhatsappAccountsController } from '../whatsapp-accounts.controller'
import { WhatsappAccountsService } from '../whatsapp-accounts.service'
import { WAHASessionService } from '../../infrastructure/waha/waha-session.service'
import { SessionGuard } from '../../auth/session.guard'
import { NotFoundException, ForbiddenException } from '@nestjs/common'
import { Request } from 'express'

describe('WhatsappAccountsController', () => {
  let controller: WhatsappAccountsController
  let mockService: jest.Mocked<WhatsappAccountsService>
  let mockWahaService: jest.Mocked<WAHASessionService>

  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockAccount = {
    id: 'account-456',
    userId: 'user-123',
    name: 'Test Account',
    phoneNumber: null,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(async () => {
    mockService = {
      findById: jest.fn(),
      findAllByUser: jest.fn(),
      findUserIdBySession: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any

    mockWahaService = {
      deleteSession: jest.fn(),
      stopSession: jest.fn(),
      getSession: jest.fn(),
      createSession: jest.fn(),
      startSession: jest.fn(),
      ensureSessionStarted: jest.fn(),
      getConnectionStatus: jest.fn(),
      getQRCode: jest.fn(),
      getSessionMe: jest.fn(),
      runDiagnostics: jest.fn(),
      mapWAHAStatusToConnectionStatus: jest.fn(),
      ping: jest.fn(),
      listSessions: jest.fn()
    } as any

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsappAccountsController],
      providers: [
        {
          provide: WhatsappAccountsService,
          useValue: mockService
        },
        {
          provide: WAHASessionService,
          useValue: mockWahaService
        }
      ]
    })
      .overrideGuard(SessionGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<WhatsappAccountsController>(WhatsappAccountsController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('delete', () => {
    const mockRequest = { user: mockUser } as Request

    it('should delete WAHA session and account successfully', async () => {
      mockService.findById.mockResolvedValue(mockAccount)
      mockWahaService.deleteSession.mockResolvedValue(undefined)
      mockService.delete.mockResolvedValue(undefined)

      await controller.delete(mockAccount.id, mockRequest)

      // Verify ownership check
      expect(mockService.findById).toHaveBeenCalledWith(mockAccount.id, mockUser.id)

      // Verify WAHA session deletion
      expect(mockWahaService.deleteSession).toHaveBeenCalledWith(mockAccount.id)

      // Verify database deletion
      expect(mockService.delete).toHaveBeenCalledWith(mockAccount.id, mockUser.id)
    })

    it('should proceed with account deletion even if WAHA session deletion fails', async () => {
      mockService.findById.mockResolvedValue(mockAccount)
      mockWahaService.deleteSession.mockRejectedValue(new Error('WAHA unreachable'))
      mockService.delete.mockResolvedValue(undefined)

      // Should not throw
      await expect(controller.delete(mockAccount.id, mockRequest)).resolves.not.toThrow()

      // WAHA deletion was attempted
      expect(mockWahaService.deleteSession).toHaveBeenCalledWith(mockAccount.id)

      // Database deletion still happens
      expect(mockService.delete).toHaveBeenCalledWith(mockAccount.id, mockUser.id)
    })

    it('should throw NotFoundException if account not found', async () => {
      mockService.findById.mockRejectedValue(new NotFoundException('Conta WhatsApp não encontrada'))

      await expect(controller.delete('non-existent-id', mockRequest)).rejects.toThrow(
        NotFoundException
      )

      // WAHA deletion should not be attempted
      expect(mockWahaService.deleteSession).not.toHaveBeenCalled()

      // Database deletion should not be attempted
      expect(mockService.delete).not.toHaveBeenCalled()
    })

    it('should throw ForbiddenException if user does not own the account', async () => {
      mockService.findById.mockRejectedValue(new ForbiddenException('Acesso negado'))

      await expect(controller.delete(mockAccount.id, mockRequest)).rejects.toThrow(
        ForbiddenException
      )

      // WAHA deletion should not be attempted
      expect(mockWahaService.deleteSession).not.toHaveBeenCalled()

      // Database deletion should not be attempted
      expect(mockService.delete).not.toHaveBeenCalled()
    })

    it('should handle WAHA 404 gracefully (session does not exist)', async () => {
      mockService.findById.mockResolvedValue(mockAccount)
      // WAHA returns success even for 404 (idempotent)
      mockWahaService.deleteSession.mockResolvedValue(undefined)
      mockService.delete.mockResolvedValue(undefined)

      await expect(controller.delete(mockAccount.id, mockRequest)).resolves.not.toThrow()

      expect(mockService.delete).toHaveBeenCalled()
    })

    it('should use account id as WAHA session name', async () => {
      mockService.findById.mockResolvedValue(mockAccount)
      mockWahaService.deleteSession.mockResolvedValue(undefined)
      mockService.delete.mockResolvedValue(undefined)

      await controller.delete(mockAccount.id, mockRequest)

      // Session name should be the account ID
      expect(mockWahaService.deleteSession).toHaveBeenCalledWith(mockAccount.id)
    })
  })
})
