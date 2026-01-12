import { Inject, Injectable } from '@nestjs/common'
import { SystemPrompt } from '../../domain/entities/system-prompt.entity'
import { SystemPromptRepository } from '../../domain/repositories/system-prompt.repository'
import { SYSTEM_PROMPT_REPOSITORY } from '../../tokens'

export interface SaveSystemPromptDto {
  userId: string
  content: string
}

export interface SaveSystemPromptResult {
  success: boolean
  error?: string
}

@Injectable()
export class SaveSystemPromptUseCase {
  constructor(
    @Inject(SYSTEM_PROMPT_REPOSITORY)
    private readonly systemPromptRepository: SystemPromptRepository
  ) {}

  async execute(dto: SaveSystemPromptDto): Promise<SaveSystemPromptResult> {
    try {
      if (!dto.userId) {
        throw new Error('User ID is required')
      }

      const existingPrompt = await this.systemPromptRepository.get(dto.userId)

      if (existingPrompt) {
        existingPrompt.updateContent(dto.content)
        await this.systemPromptRepository.save(existingPrompt)
      } else {
        const newPrompt = SystemPrompt.create(dto.userId, dto.content)
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
