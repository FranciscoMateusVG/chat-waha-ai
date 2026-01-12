import { Inject, Injectable, Logger } from '@nestjs/common'
import { KnowledgeRepository } from '../../domain/repositories/knowledge.repository'
import { KNOWLEDGE_REPOSITORY } from '../../tokens'

export interface ListTopicsDto {
  userId: string
  type: string
}

export interface ListTopicsResult {
  success: boolean
  topics?: string[]
  error?: string
}

@Injectable()
export class ListTopicsUseCase {
  private readonly logger = new Logger(ListTopicsUseCase.name)

  constructor(
    @Inject(KNOWLEDGE_REPOSITORY)
    private readonly knowledgeRepository: KnowledgeRepository
  ) {}

  async execute(dto: ListTopicsDto): Promise<ListTopicsResult> {
    try {
      if (!dto.userId) {
        throw new Error('User ID is required')
      }

      this.logger.log(`Retrieving topics for type: ${dto.type}`)

      if (!dto.type) {
        throw new Error('Type is required')
      }

      const topics = await this.knowledgeRepository.findTopicsInType(dto.userId, dto.type)

      this.logger.log(`Found ${topics.length} topics for type: ${dto.type}`)

      return {
        success: true,
        topics
      }
    } catch (error) {
      this.logger.error(
        `Failed to retrieve topics for type ${dto.type}: ${error.message}`,
        error.stack
      )

      return {
        success: false,
        error: error.message
      }
    }
  }
}