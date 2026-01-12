import { Inject, Injectable, Logger } from '@nestjs/common'
import { KnowledgeEntry } from '../../domain/entities/knowledge-entry.entity'
import { KnowledgeRepository } from '../../domain/repositories/knowledge.repository'
import { KNOWLEDGE_REPOSITORY } from '../../tokens'

export interface SearchKnowledgeDto {
  userId: string
  query: string
  type?: string
  tags?: string[]
}

export interface SearchKnowledgeResult {
  success: boolean
  knowledge?: Array<{
    id: string
    type: string
    topic: string
    key: string
    content: string
    tags?: string[]
    metadata?: Record<string, any>
    createdAt: Date
    updatedAt: Date
  }>
  error?: string
}

@Injectable()
export class SearchKnowledgeUseCase {
  private readonly logger = new Logger(SearchKnowledgeUseCase.name)

  constructor(
    @Inject(KNOWLEDGE_REPOSITORY)
    private readonly knowledgeRepository: KnowledgeRepository
  ) {}

  async execute(dto: SearchKnowledgeDto): Promise<SearchKnowledgeResult> {
    try {
      this.logger.log(`Searching knowledge entries with query: ${dto.query}`)

      if (!dto.userId) {
        throw new Error('User ID is required')
      }
      if (!dto.query || dto.query.trim().length === 0) {
        throw new Error('Search query is required')
      }

      let knowledgeEntries: KnowledgeEntry[]

      if (dto.tags && dto.tags.length > 0) {
        knowledgeEntries = await this.knowledgeRepository.searchByTags(dto.userId, dto.tags)
      } else if (dto.type) {
        knowledgeEntries = await this.knowledgeRepository.searchByType(dto.userId, dto.type, dto.query.trim())
      } else {
        knowledgeEntries = await this.knowledgeRepository.search(dto.userId, dto.query.trim())
      }

      this.logger.log(`Found ${knowledgeEntries.length} knowledge entries`)

      return {
        success: true,
        knowledge: knowledgeEntries.map(entry => ({
          id: entry.id.value,
          type: entry.type,
          topic: entry.topic,
          key: entry.key,
          content: entry.content,
          tags: entry.tags,
          metadata: entry.metadata,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        }))
      }
    } catch (error) {
      this.logger.error(
        `Failed to search knowledge entries: ${error.message}`,
        error.stack
      )

      return {
        success: false,
        error: error.message
      }
    }
  }
}