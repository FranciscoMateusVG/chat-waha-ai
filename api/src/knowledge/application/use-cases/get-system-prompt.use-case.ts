import { Inject, Injectable } from '@nestjs/common'
import { SystemPrompt } from '../../domain/entities/system-prompt.entity'
import { SystemPromptRepository } from '../../domain/repositories/system-prompt.repository'
import { SYSTEM_PROMPT_REPOSITORY } from '../../tokens'

export interface GetSystemPromptRequest {
  userId: string
}

export interface GetSystemPromptResult {
  success: boolean
  systemPrompt?: SystemPrompt | null
  error?: string
}

@Injectable()
export class GetSystemPromptUseCase {
  constructor(
    @Inject(SYSTEM_PROMPT_REPOSITORY)
    private readonly systemPromptRepository: SystemPromptRepository
  ) {}

  async execute(request: GetSystemPromptRequest): Promise<GetSystemPromptResult> {
    try {
      if (!request.userId) {
        throw new Error('User ID is required')
      }

      const systemPrompt = await this.systemPromptRepository.get(request.userId)

      return {
        success: true,
        systemPrompt
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}
