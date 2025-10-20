import { Inject, Injectable } from '@nestjs/common'
import { KnowledgeEntry } from '../../domain/entities/knowledge-entry.entity'
import {
  KnowledgeRepository,
  PaginatedResult
} from '../../domain/repositories/knowledge.repository'
import { KNOWLEDGE_REPOSITORY } from '../../tokens'

export interface ListAllKnowledgeRequest {
  page?: number
  limit?: number
}

export interface ListAllKnowledgeResponse {
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
  pagination?: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  error?: string
}

@Injectable()
export class ListAllKnowledgeUseCase {
  constructor(
    @Inject(KNOWLEDGE_REPOSITORY)
    private readonly knowledgeRepository: KnowledgeRepository
  ) {}

  async execute(
    request: ListAllKnowledgeRequest = {}
  ): Promise<ListAllKnowledgeResponse> {
    try {
      const page = request.page || 1
      const limit = request.limit || 10

      const result: PaginatedResult<KnowledgeEntry> =
        await this.knowledgeRepository.findAllPaginated({ page, limit })

      const knowledge = result.items.map((entry) => ({
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

      const totalPages = Math.ceil(result.total / limit)

      return {
        success: true,
        knowledge,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalItems: result.total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to list knowledge entries'
      }
    }
  }
}
