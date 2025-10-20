import { ChatHistory } from '../entities/chat-history'

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface ChatHistoryRepository {
  findOpenChatHistoryByExternalChatId(
    externalChatId: string
  ): Promise<ChatHistory>
  findAllOpenChatHistories(): Promise<ChatHistory[]>
  findAllChatHistories(): Promise<ChatHistory[]>
  findAllChatHistoriesPaginated(
    params: PaginationParams
  ): Promise<PaginatedResult<ChatHistory>>
  findChatHistoryById(id: string): Promise<ChatHistory | null>
  save(chatHistory: ChatHistory): Promise<void>
}
