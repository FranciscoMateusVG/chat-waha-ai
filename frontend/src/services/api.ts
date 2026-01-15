import axios from 'axios'
import type {
  ApiResponse,
  ChannelStats,
  ChatHistory,
  ChatHistoryWithMessages,
  ChatMessage,
  CreateKnowledgeDto,
  CreateWhatsappAccountDto,
  Knowledge,
  NotificationHistory,
  NotificationStats,
  PaginatedResponse,
  SystemPrompt,
  UpdateKnowledgeDto,
  UpdateWhatsappAccountDto,
  User,
  WhatsappAccount,
  WhatsAppConnectionStatus,
  WhatsAppDiagnosticsData,
  WhatsAppQRCodeData
} from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Auth API
export const authApi = {
  register: async (
    email: string,
    password: string,
    name?: string
  ): Promise<{ user: User }> => {
    const response = await api.post<{ user: User }>('/auth/register', {
      email,
      password,
      name
    })
    return response.data
  },

  login: async (email: string, password: string): Promise<{ user: User }> => {
    const response = await api.post<{ user: User }>('/auth/login', {
      email,
      password
    })
    return response.data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  me: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/auth/me')
    return response.data
  }
}

// WhatsApp Accounts API
export const whatsappAccountsApi = {
  getAll: async (): Promise<WhatsappAccount[]> => {
    const response = await api.get<{ accounts: WhatsappAccount[] }>(
      '/whatsapp-accounts'
    )
    return response.data.accounts
  },

  getById: async (id: string): Promise<WhatsappAccount> => {
    const response = await api.get<{ account: WhatsappAccount }>(
      `/whatsapp-accounts/${id}`
    )
    return response.data.account
  },

  create: async (dto: CreateWhatsappAccountDto): Promise<WhatsappAccount> => {
    const response = await api.post<{ account: WhatsappAccount }>(
      '/whatsapp-accounts',
      dto
    )
    return response.data.account
  },

  update: async (
    id: string,
    dto: UpdateWhatsappAccountDto
  ): Promise<WhatsappAccount> => {
    const response = await api.patch<{ account: WhatsappAccount }>(
      `/whatsapp-accounts/${id}`,
      dto
    )
    return response.data.account
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/whatsapp-accounts/${id}`)
  },

  // WAHA Integration endpoints
  getStatus: async (
    id: string
  ): Promise<ApiResponse<WhatsAppConnectionStatus>> => {
    const response = await api.get<ApiResponse<WhatsAppConnectionStatus>>(
      `/whatsapp-accounts/${id}/status`
    )
    return response.data
  },

  getQRCode: async (id: string): Promise<ApiResponse<WhatsAppQRCodeData>> => {
    const response = await api.get<ApiResponse<WhatsAppQRCodeData>>(
      `/whatsapp-accounts/${id}/qr`
    )
    return response.data
  },

  connect: async (
    id: string
  ): Promise<
    ApiResponse<{ sessionId: string; status: string; message: string }>
  > => {
    const response = await api.post<
      ApiResponse<{ sessionId: string; status: string; message: string }>
    >(`/whatsapp-accounts/${id}/connect`)
    return response.data
  },

  disconnect: async (
    id: string
  ): Promise<
    ApiResponse<{ sessionId: string; status: string; message: string }>
  > => {
    const response = await api.post<
      ApiResponse<{ sessionId: string; status: string; message: string }>
    >(`/whatsapp-accounts/${id}/disconnect`)
    return response.data
  },

  getDiagnostics: async (
    id: string
  ): Promise<ApiResponse<WhatsAppDiagnosticsData>> => {
    const response = await api.get<ApiResponse<WhatsAppDiagnosticsData>>(
      `/whatsapp-accounts/${id}/diagnostics`
    )
    return response.data
  },

  createSession: async (
    id: string
  ): Promise<
    ApiResponse<{ sessionId: string; status: string; message: string }>
  > => {
    const response = await api.post<
      ApiResponse<{ sessionId: string; status: string; message: string }>
    >(`/whatsapp-accounts/${id}/diagnostics/create-session`)
    return response.data
  }
}

// Chat History API
export const chatHistoryApi = {
  getAll: async (
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<ChatHistory>> => {
    const response = await api.get<PaginatedResponse<ChatHistory>>(
      '/chat-history',
      {
        params: { page, limit }
      }
    )
    return response.data
  },

  getById: async (
    id: string
  ): Promise<ApiResponse<ChatHistoryWithMessages>> => {
    const response = await api.get<ApiResponse<ChatHistoryWithMessages>>(
      `/chat-history/${id}`
    )
    return response.data
  },

  getMessages: async (id: string): Promise<ApiResponse<ChatMessage[]>> => {
    const response = await api.get<ApiResponse<ChatMessage[]>>(
      `/chat-history/${id}/messages`
    )
    return response.data
  },

  close: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.patch<ApiResponse<{ message: string }>>(
      `/chat-history/${id}/close`
    )
    return response.data
  }
}

// Knowledge API
export const knowledgeApi = {
  getAll: async (
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Knowledge>> => {
    const response = await api.get<PaginatedResponse<Knowledge>>(
      '/knowledge/all',
      {
        params: { page, limit }
      }
    )
    return response.data
  },

  create: async (
    dto: CreateKnowledgeDto
  ): Promise<ApiResponse<{ knowledgeId: string }>> => {
    const response = await api.post<ApiResponse<{ knowledgeId: string }>>(
      '/knowledge',
      dto
    )
    return response.data
  },

  getByTypeAndTopic: async (
    type: string,
    topic: string
  ): Promise<ApiResponse<Knowledge | null>> => {
    const response = await api.get<ApiResponse<Knowledge | null>>(
      `/knowledge/${encodeURIComponent(type)}/${encodeURIComponent(topic)}`
    )
    return response.data
  },

  update: async (
    type: string,
    topic: string,
    dto: UpdateKnowledgeDto
  ): Promise<ApiResponse<{ knowledgeId: string }>> => {
    const response = await api.put<ApiResponse<{ knowledgeId: string }>>(
      `/knowledge/${encodeURIComponent(type)}/${encodeURIComponent(topic)}`,
      dto
    )
    return response.data
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/knowledge/id/${id}`
    )
    return response.data
  },

  getTypes: async (): Promise<ApiResponse<string[]>> => {
    const response = await api.get<ApiResponse<string[]>>('/knowledge/types')
    return response.data
  },

  getTopicsByType: async (type: string): Promise<ApiResponse<string[]>> => {
    const response = await api.get<ApiResponse<string[]>>(
      `/knowledge/types/${encodeURIComponent(type)}/topics`
    )
    return response.data
  },

  search: async (
    query: string,
    type?: string,
    tags?: string[]
  ): Promise<ApiResponse<Knowledge[]>> => {
    const params: Record<string, string> = { query }
    if (type) params.type = type
    if (tags?.length) params.tags = tags.join(',')

    const response = await api.get<ApiResponse<Knowledge[]>>(
      '/knowledge/search',
      { params }
    )
    return response.data
  },

  getSystemPrompt: async (): Promise<ApiResponse<SystemPrompt | null>> => {
    const response = await api.get<ApiResponse<SystemPrompt | null>>(
      '/knowledge/system-prompt'
    )
    return response.data
  },

  saveSystemPrompt: async (
    content: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/knowledge/system-prompt',
      { content }
    )
    return response.data
  },

  deleteSystemPrompt: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      '/knowledge/system-prompt'
    )
    return response.data
  }
}

// Notifications API
export const notificationsApi = {
  getHistoryByRecipient: async (
    recipientId: string,
    params?: {
      channel?: string
      status?: string
      startDate?: string
      endDate?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ success: boolean; data: NotificationHistory[] }> => {
    const response = await api.get<{
      success: boolean
      data: NotificationHistory[]
    }>(`/notifications/history/recipient/${recipientId}`, { params })
    return response.data
  },

  getHistoryByChannel: async (
    channel: string,
    params?: {
      recipientId?: string
      status?: string
      startDate?: string
      endDate?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ success: boolean; data: NotificationHistory[] }> => {
    const response = await api.get<{
      success: boolean
      data: NotificationHistory[]
    }>(`/notifications/history/channel/${channel}`, { params })
    return response.data
  },

  getStats: async (params?: {
    startDate?: string
    endDate?: string
  }): Promise<{ success: boolean; data: NotificationStats }> => {
    const response = await api.get<{
      success: boolean
      data: NotificationStats
    }>('/notifications/stats', { params })
    return response.data
  },

  getChannelStats: async (params?: {
    startDate?: string
    endDate?: string
  }): Promise<{ success: boolean; data: ChannelStats[] }> => {
    const response = await api.get<{ success: boolean; data: ChannelStats[] }>(
      '/notifications/stats/channels',
      { params }
    )
    return response.data
  },

  healthCheck: async (): Promise<{
    success: boolean
    message: string
    timestamp: string
  }> => {
    const response = await api.get<{
      success: boolean
      message: string
      timestamp: string
    }>('/notifications/health')
    return response.data
  }
}
