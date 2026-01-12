import { Inject, Injectable } from '@nestjs/common'
import { SystemPromptRepository } from '../../domain/repositories/system-prompt.repository'
import { SYSTEM_PROMPT_REPOSITORY } from '../../tokens'

export interface DeleteSystemPromptRequest {
  userId: string
}

export interface DeleteSystemPromptResponse {
  success: boolean
  error?: string
}

@Injectable()
export class DeleteSystemPromptUseCase {
  constructor(
    @Inject(SYSTEM_PROMPT_REPOSITORY)
    private readonly systemPromptRepository: SystemPromptRepository
  ) {}

  async execute(request: DeleteSystemPromptRequest): Promise<DeleteSystemPromptResponse> {
    try {
      if (!request.userId) {
        throw new Error('User ID is required')
      }

      // Check if system prompt exists for this user
      const prompt = await this.systemPromptRepository.get(request.userId)
      if (!prompt) {
        return {
          success: false,
          error: 'System prompt not found'
        }
      }

      await this.systemPromptRepository.delete(request.userId)

      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete system prompt'
      }
    }
  }
}
