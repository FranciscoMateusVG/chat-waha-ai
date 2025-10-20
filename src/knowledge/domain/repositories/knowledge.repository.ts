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
  findById(id: KnowledgeId): Promise<KnowledgeEntry | null>
  findByKey(key: string): Promise<KnowledgeEntry | null>
  findByTypeAndTopic(
    type: string,
    topic: string
  ): Promise<KnowledgeEntry | null>
  findAll(): Promise<KnowledgeEntry[]>
  findAllPaginated(
    params: PaginationParams
  ): Promise<PaginatedResult<KnowledgeEntry>>
  delete(id: KnowledgeId): Promise<void>

  findAllTypes(): Promise<string[]>
  findTopicsInType(type: string): Promise<string[]>
  findByTopic(topic: string): Promise<KnowledgeEntry[]>

  search(query: string): Promise<KnowledgeEntry[]>
  searchByType(type: string, query: string): Promise<KnowledgeEntry[]>
  searchByTags(tags: string[]): Promise<KnowledgeEntry[]>
}
