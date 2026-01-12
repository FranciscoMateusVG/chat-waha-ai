import { Inject, Injectable, Logger } from '@nestjs/common'
import { KnowledgeRepository } from '../../domain/repositories/knowledge.repository'
import { KNOWLEDGE_REPOSITORY } from '../../tokens'
import { KnowledgeEntry } from '../../domain/entities/knowledge-entry.entity'

export interface BatchRetrieveKnowledgeDto {
  userId: string
  topics: string[]
}

export interface BatchRetrieveKnowledgeResult {
  success: boolean
  knowledge: KnowledgeEntry[]
  notFound: string[]
  error?: string
}

@Injectable()
export class BatchRetrieveKnowledgeUseCase {
  private readonly logger = new Logger(BatchRetrieveKnowledgeUseCase.name)

  constructor(
    @Inject(KNOWLEDGE_REPOSITORY)
    private readonly knowledgeRepository: KnowledgeRepository
  ) {}

  async execute(dto: BatchRetrieveKnowledgeDto): Promise<BatchRetrieveKnowledgeResult> {
    try {
      if (!dto.userId) {
        throw new Error('User ID is required')
      }

      this.logger.log(`Retrieving knowledge for ${dto.topics.length} topics`)

      if (!dto.topics || dto.topics.length === 0) {
        throw new Error('Topics array is required and cannot be empty')
      }

      const allKnowledge: KnowledgeEntry[] = []
      const notFound: string[] = []

      for (const topic of dto.topics) {
        const entries = await this.knowledgeRepository.findByTopic(dto.userId, topic)
        
        if (entries.length === 0) {
          notFound.push(topic)
          this.logger.warn(`No knowledge found for topic: ${topic}`)
        } else {
          allKnowledge.push(...entries)
          this.logger.log(`Found ${entries.length} entries for topic: ${topic}`)
        }
      }

      this.logger.log(`Retrieved ${allKnowledge.length} total knowledge entries, ${notFound.length} topics not found`)

      return {
        success: true,
        knowledge: allKnowledge,
        notFound
      }
    } catch (error) {
      this.logger.error(
        `Failed to batch retrieve knowledge: ${error.message}`,
        error.stack
      )

      return {
        success: false,
        knowledge: [],
        notFound: [],
        error: error.message
      }
    }
  }
}