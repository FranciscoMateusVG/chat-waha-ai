import { Inject, Injectable } from '@nestjs/common'
import { KnowledgeRepository } from '../../domain/repositories/knowledge.repository'
import { KnowledgeId } from '../../domain/value-objects'
import { KNOWLEDGE_REPOSITORY } from '../../tokens'

export interface DeleteKnowledgeRequest {
  userId: string
  id: string
}

export interface DeleteKnowledgeResponse {
  success: boolean
  error?: string
}

@Injectable()
export class DeleteKnowledgeUseCase {
  constructor(
    @Inject(KNOWLEDGE_REPOSITORY)
    private readonly knowledgeRepository: KnowledgeRepository
  ) {}

  async execute(
    request: DeleteKnowledgeRequest
  ): Promise<DeleteKnowledgeResponse> {
    try {
      if (!request.userId) {
        throw new Error('User ID is required')
      }

      const knowledgeId = new KnowledgeId(request.id)

      // Check if knowledge exists for this user
      const knowledge = await this.knowledgeRepository.findById(request.userId, knowledgeId)
      if (!knowledge) {
        return {
          success: false,
          error: 'Knowledge entry not found'
        }
      }

      await this.knowledgeRepository.delete(request.userId, knowledgeId)

      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete knowledge entry'
      }
    }
  }
}
