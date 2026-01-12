import { Inject, Injectable, Logger } from '@nestjs/common'
import { KnowledgeRepository } from '../../domain/repositories/knowledge.repository'
import { KNOWLEDGE_REPOSITORY } from '../../tokens'

export interface ListKnowledgeTypesRequest {
  userId: string
}

export interface ListKnowledgeTypesResult {
  success: boolean
  types?: string[]
  error?: string
}

@Injectable()
export class ListKnowledgeTypesUseCase {
  private readonly logger = new Logger(ListKnowledgeTypesUseCase.name)

  constructor(
    @Inject(KNOWLEDGE_REPOSITORY)
    private readonly knowledgeRepository: KnowledgeRepository
  ) {}

  async execute(request: ListKnowledgeTypesRequest): Promise<ListKnowledgeTypesResult> {
    try {
      if (!request.userId) {
        throw new Error('User ID is required')
      }

      this.logger.log('Retrieving all knowledge types')

      const types = await this.knowledgeRepository.findAllTypes(request.userId)

      this.logger.log(`Found ${types.length} knowledge types`)

      return {
        success: true,
        types
      }
    } catch (error) {
      this.logger.error(
        `Failed to retrieve knowledge types: ${error.message}`,
        error.stack
      )

      return {
        success: false,
        error: error.message
      }
    }
  }
}