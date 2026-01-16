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
    userId: string,
    externalChatId: string
  ): Promise<ChatHistory | null>
  findAllOpenChatHistories(userId: string): Promise<ChatHistory[]>
  findAllChatHistories(userId: string): Promise<ChatHistory[]>
  findAllChatHistoriesPaginated(
    userId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<ChatHistory>>
  findChatHistoryById(userId: string, id: string): Promise<ChatHistory | null>
  save(chatHistory: ChatHistory): Promise<void>
  delete(userId: string, id: string): Promise<void>

  // System methods (for internal processes like scheduler)
  findAllOpenChatHistoriesAcrossAllUsers(): Promise<ChatHistory[]>
}
