import { Inject, Injectable } from '@nestjs/common'
import { SystemPromptRepository } from '../../domain/repositories/system-prompt.repository'
import { SYSTEM_PROMPT_REPOSITORY } from '../../tokens'

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

  async execute(): Promise<DeleteSystemPromptResponse> {
    try {
      // Check if system prompt exists
      const prompt = await this.systemPromptRepository.get()
      if (!prompt) {
        return {
          success: false,
          error: 'System prompt not found'
        }
      }

      await this.systemPromptRepository.delete()

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
