export interface AiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AiService {
  /**
   * Generate AI response with tool support
   * @param context - Array of messages for conversation context
   * @returns Generated response text
   */
  generateResponse(context: AiMessage[]): Promise<string>
}
