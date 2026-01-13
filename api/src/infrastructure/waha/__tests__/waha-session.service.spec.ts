import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { WAHASessionService } from '../waha-session.service'

describe('WAHASessionService', () => {
  let service: WAHASessionService
  let mockConfigService: jest.Mocked<ConfigService>
  let mockFetch: jest.SpyInstance

  const mockBaseUrl = 'http://localhost:3002'
  const mockApiKey = 'test-api-key'
  const mockSessionName = 'test-session-id'

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'WAHA_BASE_URL':
            return mockBaseUrl
          case 'WAHA_API_KEY':
            return mockApiKey
          case 'WAHA_TIMEOUT':
            return 10000
          case 'WAHA_RETRY_ATTEMPTS':
            return 2
          case 'WAHA_RETRY_DELAY':
            return 100
          default:
            return undefined
        }
      })
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WAHASessionService,
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
    }).compile()

    service = module.get<WAHASessionService>(WAHASessionService)

    // Mock global fetch
    mockFetch = jest.spyOn(global, 'fetch')
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  describe('deleteSession', () => {
    it('should successfully delete a WAHA session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ name: mockSessionName })
      } as Response)

      await service.deleteSession(mockSessionName)

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/sessions/${mockSessionName}`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Api-Key': mockApiKey
          })
        })
      )
    })

    it('should handle 404 gracefully (idempotent operation)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found'
      } as Response)

      // Should not throw
      await expect(service.deleteSession(mockSessionName)).resolves.not.toThrow()
    })

    it('should throw on non-404 HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      } as Response)

      await expect(service.deleteSession(mockSessionName)).rejects.toThrow(
        'Failed to delete WAHA session: HTTP 500: Internal Server Error'
      )
    })

    it('should throw on timeout', async () => {
      // Mock fetch to simulate timeout via abort
      mockFetch.mockImplementationOnce(() => {
        const error = new Error('Aborted')
        error.name = 'AbortError'
        return Promise.reject(error)
      })

      await expect(service.deleteSession(mockSessionName)).rejects.toThrow(
        'Request timeout'
      )
    })

    it('should work without API key configured', async () => {
      // Create config without API key
      const noApiKeyConfig = {
        get: jest.fn((key: string) => {
          switch (key) {
            case 'WAHA_BASE_URL':
              return mockBaseUrl
            case 'WAHA_API_KEY':
              return undefined // No API key
            case 'WAHA_TIMEOUT':
              return 10000
            default:
              return undefined
          }
        })
      }

      const moduleWithoutApiKey: TestingModule = await Test.createTestingModule({
        providers: [
          WAHASessionService,
          {
            provide: ConfigService,
            useValue: noApiKeyConfig
          }
        ]
      }).compile()

      const serviceWithoutApiKey = moduleWithoutApiKey.get<WAHASessionService>(WAHASessionService)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ name: mockSessionName })
      } as Response)

      await serviceWithoutApiKey.deleteSession(mockSessionName)

      // Verify fetch was called (API key header won't be present if not configured)
      expect(mockFetch).toHaveBeenCalled()
    })
  })
})
