import { Inject } from '@nestjs/common'
import { SystemPrompt } from '../../domain/entities/system-prompt.entity'
import { SystemPromptRepository } from '../../domain/repositories/system-prompt.repository'
import { SYSTEM_PROMPT_REPOSITORY } from '../../tokens'

export interface SaveSystemPromptDto {
  content: string
}

export interface SaveSystemPromptResult {
  success: boolean
  error?: string
}

export class SaveSystemPromptUseCase {
  constructor(
    @Inject(SYSTEM_PROMPT_REPOSITORY)
    private readonly systemPromptRepository: SystemPromptRepository
  ) {}

  async execute(dto: SaveSystemPromptDto): Promise<SaveSystemPromptResult> {
    try {
      const existingPrompt = await this.systemPromptRepository.get()

      if (existingPrompt) {
        existingPrompt.updateContent(dto.content)
        await this.systemPromptRepository.save(existingPrompt)
      } else {
        const newPrompt = SystemPrompt.create(dto.content)
        await this.systemPromptRepository.save(newPrompt)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}
