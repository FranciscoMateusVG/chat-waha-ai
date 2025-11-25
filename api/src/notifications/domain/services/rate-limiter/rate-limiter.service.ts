import { Inject, Injectable } from '@nestjs/common'
import {
  RATE_LIMITER_MAX_REQUESTS,
  RATE_LIMITER_WINDOW_MS
} from '../../../tokens'

interface RateLimitState {
  requests: number[]
  lastReset: number
}

@Injectable()
export class RateLimiterService {
  private readonly maxRequests: number
  private readonly windowMs: number
  private readonly state: Map<string, RateLimitState> = new Map<
    string,
    RateLimitState
  >()

  constructor(
    @Inject(RATE_LIMITER_MAX_REQUESTS) maxRequests: number,
    @Inject(RATE_LIMITER_WINDOW_MS) windowMs: number
  ) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async checkAndWaitIfNeeded(service: string): Promise<void> {
    const now = Date.now()
    let serviceState = this.state.get(service)

    if (!serviceState) {
      serviceState = {
        requests: [],
        lastReset: now
      }
      this.state.set(service, serviceState)
    }

    // Clean up old requests outside the window
    serviceState.requests = serviceState.requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    )

    // Check if we're within the rate limit
    if (serviceState.requests.length < this.maxRequests) {
      // We're within limits, record this request
      serviceState.requests.push(now)
      return
    }

    // We've hit the rate limit, calculate wait time
    const oldestRequest = Math.min(...serviceState.requests)
    const waitTime = this.windowMs - (now - oldestRequest)

    if (waitTime > 0) {
      console.log(
        `[RATE_LIMITER] Service ${service} hit rate limit. Waiting ${waitTime}ms...`
      )
      await new Promise((resolve) => setTimeout(resolve, waitTime))

      // After waiting, try again (recursive call)
      return this.checkAndWaitIfNeeded(service)
    }
  }

  getRemainingRequests(service: string): number {
    const serviceState = this.state.get(service)
    if (!serviceState) {
      return this.maxRequests
    }

    const now = Date.now()
    const validRequests = serviceState.requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    )

    return Math.max(0, this.maxRequests - validRequests.length)
  }

  getTimeUntilReset(service: string): number {
    const serviceState = this.state.get(service)

    if (!serviceState || serviceState.requests.length === 0) {
      return 0
    }

    const now = Date.now()
    const oldestRequest = Math.min(...serviceState.requests)
    const resetTime = oldestRequest + this.windowMs

    return Math.max(0, resetTime - now)
  }

  getRateLimitInfo(service: string): {
    maxRequests: number
    remainingRequests: number
    windowMs: number
    timeUntilReset: number
  } {
    const serviceState = this.state.get(service)

    if (!serviceState) {
      return {
        maxRequests: Infinity,
        remainingRequests: Infinity,
        windowMs: 0,
        timeUntilReset: 0
      }
    }

    return {
      maxRequests: this.maxRequests,
      remainingRequests: this.getRemainingRequests(service),
      windowMs: this.windowMs,
      timeUntilReset: this.getTimeUntilReset(service)
    }
  }

  // For testing purposes
  resetState(service?: string): void {
    if (service) {
      this.state.delete(service)
    } else {
      this.state.clear()
    }
  }
}
