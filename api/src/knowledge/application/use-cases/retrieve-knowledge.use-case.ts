import { Inject, Injectable, Logger } from '@nestjs/common'
import { KnowledgeEntry } from '../../domain/entities/knowledge-entry.entity'
import { KnowledgeRepository } from '../../domain/repositories/knowledge.repository'
import { KNOWLEDGE_REPOSITORY } from '../../tokens'

export interface RetrieveKnowledgeDto {
  userId: string
  type: string
  topic: string
}

export interface RetrieveKnowledgeResult {
  success: boolean
  knowledge?: {
    id: string
    type: string
    topic: string
    key: string
    content: string
    tags?: string[]
    metadata?: Record<string, any>
    createdAt: Date
    updatedAt: Date
  }
  error?: string
}

@Injectable()
export class RetrieveKnowledgeUseCase {
  private readonly logger = new Logger(RetrieveKnowledgeUseCase.name)

  constructor(
    @Inject(KNOWLEDGE_REPOSITORY)
    private readonly knowledgeRepository: KnowledgeRepository
  ) {}

  async execute(dto: RetrieveKnowledgeDto): Promise<RetrieveKnowledgeResult> {
    try {
      this.logger.log(`Retrieving knowledge entry with type: ${dto.type}, topic: ${dto.topic}`)

      if (!dto.userId) {
        throw new Error('User ID is required')
      }
      if (!dto.type || !dto.topic) {
        throw new Error('Type and topic are required')
      }

      const knowledgeEntry = await this.knowledgeRepository.findByTypeAndTopic(dto.userId, dto.type, dto.topic)

      if (!knowledgeEntry) {
        this.logger.log(`Knowledge entry not found for type: ${dto.type}, topic: ${dto.topic}`)
        return {
          success: true,
          knowledge: undefined
        }
      }

      this.logger.log(`Knowledge entry retrieved successfully: ${knowledgeEntry.id.value}`)

      return {
        success: true,
        knowledge: {
          id: knowledgeEntry.id.value,
          type: knowledgeEntry.type,
          topic: knowledgeEntry.topic,
          key: knowledgeEntry.key,
          content: knowledgeEntry.content,
          tags: knowledgeEntry.tags,
          metadata: knowledgeEntry.metadata,
          createdAt: knowledgeEntry.createdAt,
          updatedAt: knowledgeEntry.updatedAt
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to retrieve knowledge entry: ${error.message}`,
        error.stack
      )

      return {
        success: false,
        error: error.message
      }
    }
  }
}