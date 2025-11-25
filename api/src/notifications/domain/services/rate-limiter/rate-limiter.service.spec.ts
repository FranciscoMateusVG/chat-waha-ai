import { Test, TestingModule } from '@nestjs/testing'
import {
  RATE_LIMITER_MAX_REQUESTS,
  RATE_LIMITER_WINDOW_MS
} from '../../../tokens'
import { RateLimiterService } from './rate-limiter.service'

describe('RateLimiterService', () => {
  let service: RateLimiterService
  const maxRequests = 5
  const windowMs = 1000 // 1 second

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RATE_LIMITER_MAX_REQUESTS,
          useValue: maxRequests
        },
        {
          provide: RATE_LIMITER_WINDOW_MS,
          useValue: windowMs
        },
        RateLimiterService
      ]
    }).compile()

    service = module.get<RateLimiterService>(RateLimiterService)
  })

  afterEach(() => {
    service.resetState()
  })

  describe('checkAndWaitIfNeeded', () => {
    it('should allow requests within the rate limit', async () => {
      const serviceName = 'test-service'

      // Make requests up to the limit
      for (let i = 0; i < maxRequests; i++) {
        await service.checkAndWaitIfNeeded(serviceName)
      }

      // Should not throw or wait
      expect(service.getRemainingRequests(serviceName)).toBe(0)
    })

    it('should wait when rate limit is exceeded', async () => {
      const serviceName = 'test-service'
      const startTime = Date.now()

      // Make requests up to the limit
      for (let i = 0; i < maxRequests; i++) {
        await service.checkAndWaitIfNeeded(serviceName)
      }

      // This request should trigger waiting
      const waitStartTime = Date.now()
      await service.checkAndWaitIfNeeded(serviceName)
      const waitEndTime = Date.now()

      // Should have waited at least some time
      const waitedFor = waitEndTime - waitStartTime
      console.log(`Waited for ${waitedFor}ms`)
      expect(waitedFor).toBeGreaterThan(0)
    })

    it('should handle multiple services independently', async () => {
      const service1 = 'service-1'
      const service2 = 'service-2'

      // Fill up service1's rate limit
      for (let i = 0; i < maxRequests; i++) {
        await service.checkAndWaitIfNeeded(service1)
      }

      // service2 should still have full capacity
      expect(service.getRemainingRequests(service2)).toBe(maxRequests)

      // Fill up service2's rate limit
      for (let i = 0; i < maxRequests; i++) {
        await service.checkAndWaitIfNeeded(service2)
      }

      expect(service.getRemainingRequests(service1)).toBe(0)
      expect(service.getRemainingRequests(service2)).toBe(0)
    })

    it('should clean up old requests outside the window', async () => {
      const serviceName = 'test-service'

      // Fill up the rate limit
      for (let i = 0; i < maxRequests; i++) {
        await service.checkAndWaitIfNeeded(serviceName)
      }

      // Wait for the window to expire
      await new Promise((resolve) => setTimeout(resolve, windowMs + 100))

      // Should be able to make requests again
      await service.checkAndWaitIfNeeded(serviceName)
      expect(service.getRemainingRequests(serviceName)).toBe(maxRequests - 1)
    })

    it('should create new state for unknown service', async () => {
      const serviceName = 'new-service'

      await service.checkAndWaitIfNeeded(serviceName)

      expect(service.getRemainingRequests(serviceName)).toBe(maxRequests - 1)
    })
  })

  describe('getRemainingRequests', () => {
    it('should return max requests for unknown service', () => {
      const serviceName = 'unknown-service'
      expect(service.getRemainingRequests(serviceName)).toBe(maxRequests)
    })

    it('should return correct remaining requests', async () => {
      const serviceName = 'test-service'

      // Make 2 requests
      await service.checkAndWaitIfNeeded(serviceName)
      await service.checkAndWaitIfNeeded(serviceName)

      expect(service.getRemainingRequests(serviceName)).toBe(maxRequests - 2)
    })

    it('should return 0 when rate limit is reached', async () => {
      const serviceName = 'test-service'

      // Fill up the rate limit
      for (let i = 0; i < maxRequests; i++) {
        await service.checkAndWaitIfNeeded(serviceName)
      }

      expect(service.getRemainingRequests(serviceName)).toBe(0)
    })

    it('should not return negative values', async () => {
      const serviceName = 'test-service'

      // Fill up the rate limit
      for (let i = 0; i < maxRequests; i++) {
        await service.checkAndWaitIfNeeded(serviceName)
      }

      // Try to get remaining requests after limit is reached
      expect(service.getRemainingRequests(serviceName)).toBe(0)
    })
  })

  describe('getTimeUntilReset', () => {
    it('should return 0 for unknown service', () => {
      const serviceName = 'unknown-service'
      expect(service.getTimeUntilReset(serviceName)).toBe(0)
    })

    it('should return 0 for service with no requests', async () => {
      const serviceName = 'test-service'
      await service.checkAndWaitIfNeeded(serviceName)
      service.resetState(serviceName)

      expect(service.getTimeUntilReset(serviceName)).toBe(0)
    })

    it('should return correct time until reset', async () => {
      const serviceName = 'test-service'
      const startTime = Date.now()

      // Make a request
      await service.checkAndWaitIfNeeded(serviceName)

      const timeUntilReset = service.getTimeUntilReset(serviceName)
      const expectedTime = windowMs - (Date.now() - startTime)

      // Allow for small timing differences
      expect(timeUntilReset).toBeGreaterThan(expectedTime - 50)
      expect(timeUntilReset).toBeLessThanOrEqual(expectedTime + 50)
    })

    it('should return 0 when window has expired', async () => {
      const serviceName = 'test-service'

      // Make a request
      await service.checkAndWaitIfNeeded(serviceName)

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, windowMs + 100))

      expect(service.getTimeUntilReset(serviceName)).toBe(0)
    })
  })

  describe('getRateLimitInfo', () => {
    it('should return correct info for unknown service', () => {
      const serviceName = 'unknown-service'
      const info = service.getRateLimitInfo(serviceName)

      expect(info).toEqual({
        maxRequests: Infinity,
        remainingRequests: Infinity,
        windowMs: 0,
        timeUntilReset: 0
      })
    })

    it('should return correct info for service with requests', async () => {
      const serviceName = 'test-service'

      // Make 2 requests
      await service.checkAndWaitIfNeeded(serviceName)
      await service.checkAndWaitIfNeeded(serviceName)

      const info = service.getRateLimitInfo(serviceName)

      expect(info.maxRequests).toBe(maxRequests)
      expect(info.remainingRequests).toBe(maxRequests - 2)
      expect(info.windowMs).toBe(windowMs)
      expect(info.timeUntilReset).toBeGreaterThan(0)
    })

    it('should return correct info when rate limit is reached', async () => {
      const serviceName = 'test-service'

      // Fill up the rate limit
      for (let i = 0; i < maxRequests; i++) {
        await service.checkAndWaitIfNeeded(serviceName)
      }

      const info = service.getRateLimitInfo(serviceName)

      expect(info.maxRequests).toBe(maxRequests)
      expect(info.remainingRequests).toBe(0)
      expect(info.windowMs).toBe(windowMs)
      expect(info.timeUntilReset).toBeGreaterThan(0)
    })
  })

  describe('resetState', () => {
    it('should reset specific service state', async () => {
      const serviceName = 'test-service'

      // Make some requests
      await service.checkAndWaitIfNeeded(serviceName)
      await service.checkAndWaitIfNeeded(serviceName)

      expect(service.getRemainingRequests(serviceName)).toBe(maxRequests - 2)

      // Reset the service
      service.resetState(serviceName)

      expect(service.getRemainingRequests(serviceName)).toBe(maxRequests)
    })

    it('should reset all services when no service specified', async () => {
      const service1 = 'service-1'
      const service2 = 'service-2'

      // Make requests to both services
      await service.checkAndWaitIfNeeded(service1)
      await service.checkAndWaitIfNeeded(service2)

      expect(service.getRemainingRequests(service1)).toBe(maxRequests - 1)
      expect(service.getRemainingRequests(service2)).toBe(maxRequests - 1)

      // Reset all services
      service.resetState()

      expect(service.getRemainingRequests(service1)).toBe(maxRequests)
      expect(service.getRemainingRequests(service2)).toBe(maxRequests)
    })

    it('should not affect other services when resetting specific service', async () => {
      const service1 = 'service-1'
      const service2 = 'service-2'

      // Make requests to both services
      await service.checkAndWaitIfNeeded(service1)
      await service.checkAndWaitIfNeeded(service2)

      // Reset only service1
      service.resetState(service1)

      expect(service.getRemainingRequests(service1)).toBe(maxRequests)
      expect(service.getRemainingRequests(service2)).toBe(maxRequests - 1)
    })
  })

  describe('edge cases', () => {
    it('should handle concurrent requests correctly', async () => {
      const serviceName = 'test-service'

      // Make concurrent requests
      const promises = Array.from({ length: maxRequests }, () =>
        service.checkAndWaitIfNeeded(serviceName)
      )

      await Promise.all(promises)

      expect(service.getRemainingRequests(serviceName)).toBe(0)
    })

    it('should handle very small window times', async () => {
      // Create a new service instance with very small window
      const smallWindowService = new RateLimiterService(2, 10) // 2 requests per 10ms

      const serviceName = 'test-service'

      // Make requests quickly
      await smallWindowService.checkAndWaitIfNeeded(serviceName)
      await smallWindowService.checkAndWaitIfNeeded(serviceName)

      expect(smallWindowService.getRemainingRequests(serviceName)).toBe(0)

      // Wait for window to reset
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(smallWindowService.getRemainingRequests(serviceName)).toBe(2)
    })

    it('should handle zero max requests', () => {
      const zeroLimitService = new RateLimiterService(0, windowMs)
      const serviceName = 'test-service'

      expect(zeroLimitService.getRemainingRequests(serviceName)).toBe(0)
    })
  })
})
