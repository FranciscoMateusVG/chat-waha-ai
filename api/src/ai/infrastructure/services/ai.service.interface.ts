export interface AiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AiService {
  /**
   * Generate AI response with tool support
   * @param userId - User ID for multi-tenant data isolation
   * @param context - Array of messages for conversation context
   * @returns Generated response text
   */
  generateResponse(userId: string, context: AiMessage[]): Promise<string>
}
