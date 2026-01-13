// API Response Types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

// WhatsApp Account Types
export interface WhatsappAccount {
  id: string;
  userId: string;
  name: string;
  phoneNumber?: string;
  status: 'pending' | 'connected' | 'disconnected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateWhatsappAccountDto {
  name: string;
  phoneNumber?: string;
}

export interface UpdateWhatsappAccountDto {
  name?: string;
  phoneNumber?: string;
  status?: 'pending' | 'connected' | 'disconnected';
}

// WAHA Connection Types
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'needs_qr' | 'failed' | 'unknown';
export type WAHASessionStatus = 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED';

export interface WhatsAppConnectionStatus {
  accountId: string;
  accountName: string;
  sessionId: string;
  status: ConnectionStatus;
  wahaStatus?: WAHASessionStatus;
  phoneNumber?: string;
  pushName?: string;
  lastChecked: string;
  error?: string;
  qrAvailable: boolean;
}

export interface WhatsAppQRCodeData {
  qrAvailable: boolean;
  qrCode?: string;
  mimetype?: string;
  message?: string;
  status?: ConnectionStatus;
}

export interface WAHADiagnosticsResult {
  wahaReachable: boolean;
  wahaVersion?: string;
  sessionExists: boolean;
  sessionStatus?: WAHASessionStatus;
  connectionStatus: ConnectionStatus;
  qrAvailable: boolean;
  phoneNumber?: string;
  pushName?: string;
  error?: string;
  checkedAt: string;
}

export interface WhatsAppDiagnosticsData {
  accountId: string;
  accountName: string;
  diagnostics: WAHADiagnosticsResult;
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

// Chat History Types
export interface ChatHistory {
  id: string;
  externalChatId: string;
  chatName: string;
  status: string;
  messageCount: number;
  openedAt: string;
  lastMessageAt: string | null;
  closedAt: string | null;
  isGroupChat: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
}

export interface ChatHistoryWithMessages extends ChatHistory {
  messages: ChatMessage[];
}

// Knowledge Types
export interface Knowledge {
  id: string;
  type: string;
  topic: string;
  content: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeDto {
  type: string;
  topic: string;
  content: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateKnowledgeDto {
  content: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface SystemPrompt {
  id: string;
  content: string;
  updatedAt: string;
}

// Notification Types
export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  channel: 'system' | 'whatsapp' | 'email';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  recipientId: string;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
}

export interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
}

export interface ChannelStats extends NotificationStats {
  channel: string;
}
