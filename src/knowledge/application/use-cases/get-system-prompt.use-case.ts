import { Inject } from '@nestjs/common'
import { SystemPrompt } from '../../domain/entities/system-prompt.entity'
import { SystemPromptRepository } from '../../domain/repositories/system-prompt.repository'
import { SYSTEM_PROMPT_REPOSITORY } from '../../tokens'

export interface GetSystemPromptResult {
  success: boolean
  systemPrompt?: SystemPrompt | null
  error?: string
}

export class GetSystemPromptUseCase {
  constructor(
    @Inject(SYSTEM_PROMPT_REPOSITORY)
    private readonly systemPromptRepository: SystemPromptRepository
  ) {}

  async execute(): Promise<GetSystemPromptResult> {
    try {
      const systemPrompt = await this.systemPromptRepository.get()

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
