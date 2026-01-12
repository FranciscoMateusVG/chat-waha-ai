import { Inject, Injectable, Logger } from '@nestjs/common'
import { KnowledgeEntry } from '../../domain/entities/knowledge-entry.entity'
import { KnowledgeRepository } from '../../domain/repositories/knowledge.repository'
import { KNOWLEDGE_REPOSITORY } from '../../tokens'

export interface StoreKnowledgeDto {
  userId: string
  type: string
  topic: string
  content: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface StoreKnowledgeResult {
  success: boolean
  knowledgeId?: string
  error?: string
}

@Injectable()
export class StoreKnowledgeUseCase {
  private readonly logger = new Logger(StoreKnowledgeUseCase.name)

  constructor(
    @Inject(KNOWLEDGE_REPOSITORY)
    private readonly knowledgeRepository: KnowledgeRepository
  ) {}

  async execute(dto: StoreKnowledgeDto): Promise<StoreKnowledgeResult> {
    try {
      this.logger.log(`Storing knowledge entry with type: ${dto.type}, topic: ${dto.topic}`)

      // Validate input
      if (!dto.userId) {
        throw new Error('User ID is required')
      }
      if (!dto.type || !dto.topic || !dto.content) {
        throw new Error('Type, topic, and content are required')
      }

      // Check if entry already exists for this user
      const existingEntry = await this.knowledgeRepository.findByTypeAndTopic(dto.userId, dto.type, dto.topic)
      let knowledgeEntry: KnowledgeEntry

      if (existingEntry) {
        // Update existing entry
        existingEntry.update(dto.content, dto.tags, dto.metadata)
        knowledgeEntry = existingEntry
        this.logger.log(`Updating existing knowledge entry: ${dto.type}:${dto.topic}`)
      } else {
        // Create new entry
        knowledgeEntry = KnowledgeEntry.create(
          dto.userId,
          dto.type,
          dto.topic,
          dto.content,
          dto.tags,
          dto.metadata
        )
        this.logger.log(`Creating new knowledge entry: ${dto.type}:${dto.topic}`)
      }

      // Save to repository
      await this.knowledgeRepository.save(knowledgeEntry)

      this.logger.log(`Knowledge entry stored successfully: ${knowledgeEntry.id.value}`)

      return {
        success: true,
        knowledgeId: knowledgeEntry.id.value
      }
    } catch (error) {
      this.logger.error(
        `Failed to store knowledge entry: ${error.message}`,
        error.stack
      )

      return {
        success: false,
        error: error.message
      }
    }
  }
}