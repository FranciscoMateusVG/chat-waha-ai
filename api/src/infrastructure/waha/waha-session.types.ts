/**
 * WAHA Session Types
 * Based on WAHA API documentation: https://waha.devlike.pro/docs/how-to/sessions/
 */

// Session states from WAHA
export type WAHASessionStatus =
  | 'STOPPED'
  | 'STARTING'
  | 'SCAN_QR_CODE'
  | 'WORKING'
  | 'FAILED'

// WAHA session response
export interface WAHASession {
  name: string
  status: WAHASessionStatus
  config?: {
    proxy?: string
    webhooks?: Array<{
      url: string
      events: string[]
    }>
  }
  me?: WAHASessionMe | null
}

// WAHA /me endpoint response
export interface WAHASessionMe {
  id: string
  pushName?: string
}

// WAHA QR code response (JSON format)
export interface WAHAQRCodeResponse {
  value: string // Base64 encoded QR code or raw value
  mimetype?: string
}

// Create session request
export interface WAHACreateSessionRequest {
  name: string
  start?: boolean
  config?: {
    proxy?: string
    webhooks?: Array<{
      url: string
      events: string[]
    }>
  }
}

// Our normalized connection status model
export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'needs_qr'
  | 'failed'
  | 'unknown'

export interface WhatsAppConnectionStatus {
  sessionId: string
  status: ConnectionStatus
  wahaStatus?: WAHASessionStatus
  phoneNumber?: string
  pushName?: string
  lastChecked: Date
  error?: string
  qrAvailable: boolean
}

export interface WAHADiagnosticsResult {
  wahaReachable: boolean
  wahaVersion?: string
  sessionExists: boolean
  sessionStatus?: WAHASessionStatus
  connectionStatus: ConnectionStatus
  qrAvailable: boolean
  phoneNumber?: string
  pushName?: string
  error?: string
  checkedAt: Date
}

// WAHA client configuration
export interface WAHAClientConfig {
  baseUrl: string
  apiKey?: string
  timeout: number
  retryAttempts: number
  retryDelay: number
}
