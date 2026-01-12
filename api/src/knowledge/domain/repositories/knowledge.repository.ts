import { KnowledgeEntry } from '../entities/knowledge-entry.entity'
import { KnowledgeId } from '../value-objects'

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface KnowledgeRepository {
  save(entry: KnowledgeEntry): Promise<void>
  findById(userId: string, id: KnowledgeId): Promise<KnowledgeEntry | null>
  findByKey(userId: string, key: string): Promise<KnowledgeEntry | null>
  findByTypeAndTopic(
    userId: string,
    type: string,
    topic: string
  ): Promise<KnowledgeEntry | null>
  findAll(userId: string): Promise<KnowledgeEntry[]>
  findAllPaginated(
    userId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<KnowledgeEntry>>
  delete(userId: string, id: KnowledgeId): Promise<void>

  findAllTypes(userId: string): Promise<string[]>
  findTopicsInType(userId: string, type: string): Promise<string[]>
  findByTopic(userId: string, topic: string): Promise<KnowledgeEntry[]>

  search(userId: string, query: string): Promise<KnowledgeEntry[]>
  searchByType(userId: string, type: string, query: string): Promise<KnowledgeEntry[]>
  searchByTags(userId: string, tags: string[]): Promise<KnowledgeEntry[]>
}
