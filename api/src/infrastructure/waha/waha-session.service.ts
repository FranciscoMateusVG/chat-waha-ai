import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  ConnectionStatus,
  WAHAClientConfig,
  WAHACreateSessionRequest,
  WAHADiagnosticsResult,
  WAHAQRCodeResponse,
  WAHASession,
  WAHASessionMe,
  WAHASessionStatus,
  WhatsAppConnectionStatus
} from './waha-session.types'

@Injectable()
export class WAHASessionService {
  private readonly logger = new Logger(WAHASessionService.name)
  private readonly config: WAHAClientConfig

  constructor(private readonly configService: ConfigService) {
    this.config = {
      baseUrl: this.configService.get<string>('WAHA_BASE_URL') || 'http://localhost:3002',
      apiKey: this.configService.get<string>('WAHA_API_KEY'),
      timeout: this.configService.get<number>('WAHA_TIMEOUT') || 10000,
      retryAttempts: this.configService.get<number>('WAHA_RETRY_ATTEMPTS') || 2,
      retryDelay: this.configService.get<number>('WAHA_RETRY_DELAY') || 1000
    }

    this.logger.log(`WAHASessionService initialized with baseUrl: ${this.config.baseUrl}`)
  }

  /**
   * Make HTTP request to WAHA with timeout and retry logic
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    attempts = this.config.retryAttempts
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    }

    if (this.config.apiKey) {
      headers['X-Api-Key'] = this.config.apiKey
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return await response.json() as T
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`)
      }

      if (attempts > 1 && this.isRetriableError(error)) {
        this.logger.warn(`Request failed, retrying... (${attempts - 1} attempts left)`)
        await this.delay(this.config.retryDelay)
        return this.fetchWithRetry<T>(url, options, attempts - 1)
      }

      throw error
    }
  }

  private isRetriableError(error: Error): boolean {
    const retriablePatterns = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'network']
    return retriablePatterns.some(pattern =>
      error.message.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Ping WAHA to check if it's reachable
   */
  async ping(): Promise<{ reachable: boolean; version?: string; error?: string }> {
    try {
      this.logger.debug('Pinging WAHA server...')
      const url = `${this.config.baseUrl}/api/sessions`
      await this.fetchWithRetry<WAHASession[]>(url, { method: 'GET' }, 1)
      return { reachable: true }
    } catch (error) {
      this.logger.error(`WAHA ping failed: ${error.message}`)
      return { reachable: false, error: error.message }
    }
  }

  /**
   * List all WAHA sessions
   */
  async listSessions(includeAll = false): Promise<WAHASession[]> {
    const url = `${this.config.baseUrl}/api/sessions${includeAll ? '?all=true' : ''}`
    this.logger.debug(`Listing WAHA sessions: ${url}`)

    try {
      const sessions = await this.fetchWithRetry<WAHASession[]>(url)
      this.logger.debug(`Found ${sessions.length} sessions`)
      return sessions
    } catch (error) {
      this.logger.error(`Failed to list sessions: ${error.message}`)
      throw new Error(`Failed to list WAHA sessions: ${error.message}`)
    }
  }

  /**
   * Get session by name
   */
  async getSession(sessionName: string): Promise<WAHASession | null> {
    const url = `${this.config.baseUrl}/api/sessions/${sessionName}`
    this.logger.debug(`Getting session: ${sessionName}`)

    try {
      const session = await this.fetchWithRetry<WAHASession>(url)
      this.logger.debug(`Session ${sessionName} status: ${session.status}`)
      return session
    } catch (error) {
      if (error.message.includes('404')) {
        this.logger.debug(`Session ${sessionName} not found`)
        return null
      }
      this.logger.error(`Failed to get session ${sessionName}: ${error.message}`)
      throw new Error(`Failed to get session: ${error.message}`)
    }
  }

  /**
   * Create a new WAHA session
   */
  async createSession(request: WAHACreateSessionRequest): Promise<WAHASession> {
    const url = `${this.config.baseUrl}/api/sessions`
    this.logger.log(`Creating session: ${request.name}`)

    try {
      const session = await this.fetchWithRetry<WAHASession>(url, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      this.logger.log(`Session ${request.name} created with status: ${session.status}`)
      return session
    } catch (error) {
      this.logger.error(`Failed to create session ${request.name}: ${error.message}`)
      throw new Error(`Failed to create session: ${error.message}`)
    }
  }

  /**
   * Start a session
   */
  async startSession(sessionName: string): Promise<WAHASession> {
    const url = `${this.config.baseUrl}/api/sessions/${sessionName}/start`
    this.logger.log(`Starting session: ${sessionName}`)

    try {
      const session = await this.fetchWithRetry<WAHASession>(url, { method: 'POST' })
      this.logger.log(`Session ${sessionName} started with status: ${session.status}`)
      return session
    } catch (error) {
      this.logger.error(`Failed to start session ${sessionName}: ${error.message}`)
      throw new Error(`Failed to start session: ${error.message}`)
    }
  }

  /**
   * Stop a session
   */
  async stopSession(sessionName: string): Promise<void> {
    const url = `${this.config.baseUrl}/api/sessions/${sessionName}/stop`
    this.logger.log(`Stopping session: ${sessionName}`)

    try {
      await this.fetchWithRetry<void>(url, { method: 'POST' })
      this.logger.log(`Session ${sessionName} stopped`)
    } catch (error) {
      this.logger.error(`Failed to stop session ${sessionName}: ${error.message}`)
      throw new Error(`Failed to stop session: ${error.message}`)
    }
  }

  /**
   * Delete a session entirely from WAHA.
   * This is idempotent - calling it on a non-existent session won't error.
   * The operation automatically stops the session if running.
   */
  async deleteSession(sessionName: string): Promise<void> {
    const url = `${this.config.baseUrl}/api/sessions/${sessionName}`
    this.logger.log(`Deleting WAHA session: ${sessionName}`)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (this.config.apiKey) {
        headers['X-Api-Key'] = this.config.apiKey
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // 404 is acceptable - session doesn't exist (idempotent)
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      this.logger.log(`WAHA session ${sessionName} deleted successfully`)
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`)
      }
      this.logger.error(`Failed to delete WAHA session ${sessionName}: ${error.message}`)
      throw new Error(`Failed to delete WAHA session: ${error.message}`)
    }
  }

  /**
   * Get QR code for a session (returns base64 or raw value)
   */
  async getQRCode(sessionName: string, format: 'base64' | 'raw' = 'base64'): Promise<WAHAQRCodeResponse | null> {
    const url = `${this.config.baseUrl}/api/${sessionName}/auth/qr${format === 'raw' ? '?format=raw' : ''}`
    this.logger.debug(`Getting QR code for session: ${sessionName}`)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const headers: Record<string, string> = {
        'Accept': 'application/json'
      }
      if (this.config.apiKey) {
        headers['X-Api-Key'] = this.config.apiKey
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 404 || response.status === 422) {
          this.logger.debug(`QR code not available for session ${sessionName}`)
          return null
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json() as WAHAQRCodeResponse
      this.logger.debug(`QR code retrieved for session ${sessionName}`)
      return data
    } catch (error) {
      if (error.name === 'AbortError') {
        this.logger.warn(`QR code request timed out for session ${sessionName}`)
        return null
      }
      this.logger.error(`Failed to get QR code for ${sessionName}: ${error.message}`)
      return null
    }
  }

  /**
   * Get authenticated user info for a session
   */
  async getSessionMe(sessionName: string): Promise<WAHASessionMe | null> {
    const url = `${this.config.baseUrl}/api/sessions/${sessionName}/me`
    this.logger.debug(`Getting /me for session: ${sessionName}`)

    try {
      const me = await this.fetchWithRetry<WAHASessionMe>(url)
      this.logger.debug(`Session ${sessionName} user: ${me.pushName || me.id}`)
      return me
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('422')) {
        this.logger.debug(`No user info available for session ${sessionName}`)
        return null
      }
      this.logger.error(`Failed to get /me for ${sessionName}: ${error.message}`)
      return null
    }
  }

  /**
   * Map WAHA status to our normalized connection status
   */
  mapWAHAStatusToConnectionStatus(wahaStatus: WAHASessionStatus | undefined): ConnectionStatus {
    if (!wahaStatus) return 'unknown'

    switch (wahaStatus) {
      case 'WORKING':
        return 'connected'
      case 'SCAN_QR_CODE':
        return 'needs_qr'
      case 'STARTING':
        return 'connecting'
      case 'STOPPED':
        return 'disconnected'
      case 'FAILED':
        return 'failed'
      default:
        return 'unknown'
    }
  }

  /**
   * Get full connection status for a session
   */
  async getConnectionStatus(sessionName: string): Promise<WhatsAppConnectionStatus> {
    this.logger.log(`Getting connection status for session: ${sessionName}`)

    try {
      const session = await this.getSession(sessionName)

      if (!session) {
        return {
          sessionId: sessionName,
          status: 'disconnected',
          lastChecked: new Date(),
          qrAvailable: false,
          error: 'Sessão não encontrada no WAHA'
        }
      }

      const status = this.mapWAHAStatusToConnectionStatus(session.status)
      const qrAvailable = session.status === 'SCAN_QR_CODE'

      let phoneNumber: string | undefined
      let pushName: string | undefined

      // Get user info if connected
      if (session.status === 'WORKING') {
        const me = await this.getSessionMe(sessionName)
        if (me) {
          phoneNumber = me.id?.split('@')[0]
          pushName = me.pushName
        }
      }

      return {
        sessionId: sessionName,
        status,
        wahaStatus: session.status,
        phoneNumber,
        pushName,
        lastChecked: new Date(),
        qrAvailable
      }
    } catch (error) {
      this.logger.error(`Failed to get connection status for ${sessionName}: ${error.message}`)
      return {
        sessionId: sessionName,
        status: 'unknown',
        lastChecked: new Date(),
        qrAvailable: false,
        error: error.message
      }
    }
  }

  /**
   * Run diagnostics for a session
   */
  async runDiagnostics(sessionName: string): Promise<WAHADiagnosticsResult> {
    this.logger.log(`Running diagnostics for session: ${sessionName}`)
    const result: WAHADiagnosticsResult = {
      wahaReachable: false,
      sessionExists: false,
      connectionStatus: 'unknown',
      qrAvailable: false,
      checkedAt: new Date()
    }

    // Step 1: Check if WAHA is reachable
    const pingResult = await this.ping()
    result.wahaReachable = pingResult.reachable
    if (!pingResult.reachable) {
      result.error = `WAHA não acessível: ${pingResult.error}`
      return result
    }

    // Step 2: Check if session exists
    const session = await this.getSession(sessionName)
    result.sessionExists = session !== null

    if (!session) {
      result.error = 'Sessão não encontrada no WAHA'
      return result
    }

    result.sessionStatus = session.status
    result.connectionStatus = this.mapWAHAStatusToConnectionStatus(session.status)

    // Step 3: Check QR availability if not connected
    if (session.status === 'SCAN_QR_CODE') {
      const qr = await this.getQRCode(sessionName)
      result.qrAvailable = qr !== null
    }

    // Step 4: Get user info if connected
    if (session.status === 'WORKING') {
      const me = await this.getSessionMe(sessionName)
      if (me) {
        result.phoneNumber = me.id?.split('@')[0]
        result.pushName = me.pushName
      }
    }

    this.logger.log(`Diagnostics complete for ${sessionName}: ${JSON.stringify(result)}`)
    return result
  }

  /**
   * Ensure a session exists and is started
   */
  async ensureSessionStarted(sessionName: string, webhookUrl?: string): Promise<WAHASession> {
    this.logger.log(`Ensuring session ${sessionName} is started`)

    let session = await this.getSession(sessionName)

    if (!session) {
      // Create the session
      session = await this.createSession({
        name: sessionName,
        start: true,
        config: webhookUrl ? {
          webhooks: [{
            url: webhookUrl,
            events: ['message', 'message.any']
          }]
        } : undefined
      })
    } else if (session.status === 'STOPPED') {
      // Start the stopped session
      session = await this.startSession(sessionName)
    }

    return session
  }
}
