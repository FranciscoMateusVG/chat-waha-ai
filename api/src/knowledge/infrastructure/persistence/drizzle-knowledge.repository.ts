import { Injectable, Logger } from '@nestjs/common'
import { and, count, desc, eq, like, or } from 'drizzle-orm'
import { DrizzleDatabaseService } from '../../../infrastructure/drizzle/database.provider'
import {
  KnowledgeEntryRecord,
  knowledgeEntries
} from '../../../infrastructure/drizzle/schemas/knowledge/schema'
import {
  KnowledgeEntry,
  KnowledgeEntryProps
} from '../../domain/entities/knowledge-entry.entity'
import {
  KnowledgeRepository,
  PaginatedResult,
  PaginationParams
} from '../../domain/repositories/knowledge.repository'
import { KnowledgeId } from '../../domain/value-objects'

@Injectable()
export class DrizzleKnowledgeRepository implements KnowledgeRepository {
  private readonly logger = new Logger(DrizzleKnowledgeRepository.name)

  constructor(private readonly databaseService: DrizzleDatabaseService) {}

  private get db() {
    return this.databaseService.getDatabase()
  }

  async save(entry: KnowledgeEntry): Promise<void> {
    try {
      const entryData = this.mapToDbRecord(entry)

      await this.db
        .insert(knowledgeEntries)
        .values(entryData)
        .onConflictDoUpdate({
          target: [knowledgeEntries.userId, knowledgeEntries.key],
          set: {
            content: entryData.content,
            tags: entryData.tags,
            metadata: entryData.metadata,
            updatedAt: entryData.updatedAt
          }
        })

      this.logger.debug(`Knowledge entry ${entry.id.value} saved successfully`)
    } catch (error) {
      this.logger.error(
        `Failed to save knowledge entry ${entry.id.value}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to save knowledge entry: ${error.message}`)
    }
  }

  async findById(userId: string, id: KnowledgeId): Promise<KnowledgeEntry | null> {
    try {
      const result = await this.db
        .select()
        .from(knowledgeEntries)
        .where(
          and(
            eq(knowledgeEntries.userId, userId),
            eq(knowledgeEntries.id, id.value)
          )
        )
        .limit(1)

      if (result.length === 0) {
        return null
      }

      return this.mapToDomainEntity(result[0])
    } catch (error) {
      this.logger.error(
        `Failed to find knowledge entry by id ${id.value}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to find knowledge entry: ${error.message}`)
    }
  }

  async findByKey(userId: string, key: string): Promise<KnowledgeEntry | null> {
    try {
      const result = await this.db
        .select()
        .from(knowledgeEntries)
        .where(
          and(
            eq(knowledgeEntries.userId, userId),
            eq(knowledgeEntries.key, key)
          )
        )
        .limit(1)

      if (result.length === 0) {
        return null
      }

      return this.mapToDomainEntity(result[0])
    } catch (error) {
      this.logger.error(
        `Failed to find knowledge entry by key ${key}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to find knowledge entry: ${error.message}`)
    }
  }

  async findByTypeAndTopic(
    userId: string,
    type: string,
    topic: string
  ): Promise<KnowledgeEntry | null> {
    try {
      const key = `${type}:${topic}`
      return this.findByKey(userId, key)
    } catch (error) {
      this.logger.error(
        `Failed to find knowledge entry by type ${type} and topic ${topic}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to find knowledge entry: ${error.message}`)
    }
  }

  async findAll(userId: string): Promise<KnowledgeEntry[]> {
    try {
      const records = await this.db
        .select()
        .from(knowledgeEntries)
        .where(eq(knowledgeEntries.userId, userId))
        .orderBy(desc(knowledgeEntries.updatedAt))

      return records.map((record) => this.mapToDomainEntity(record))
    } catch (error) {
      this.logger.error(
        `Failed to find all knowledge entries: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to find all knowledge entries: ${error.message}`)
    }
  }

  async findAllPaginated(
    userId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<KnowledgeEntry>> {
    try {
      const { page, limit } = params
      const offset = (page - 1) * limit

      // Get total count for this user
      const [{ count: totalCount }] = await this.db
        .select({ count: count() })
        .from(knowledgeEntries)
        .where(eq(knowledgeEntries.userId, userId))

      // Get paginated records for this user
      const records = await this.db
        .select()
        .from(knowledgeEntries)
        .where(eq(knowledgeEntries.userId, userId))
        .orderBy(desc(knowledgeEntries.updatedAt))
        .limit(limit)
        .offset(offset)

      const items = records.map((record) => this.mapToDomainEntity(record))

      return {
        items,
        total: totalCount,
        page,
        limit
      }
    } catch (error) {
      this.logger.error(
        `Failed to find paginated knowledge entries: ${error.message}`,
        error.stack
      )
      throw new Error(
        `Failed to find paginated knowledge entries: ${error.message}`
      )
    }
  }

  async delete(userId: string, id: KnowledgeId): Promise<void> {
    try {
      await this.db
        .delete(knowledgeEntries)
        .where(
          and(
            eq(knowledgeEntries.userId, userId),
            eq(knowledgeEntries.id, id.value)
          )
        )
      this.logger.debug(
        `Knowledge entry with id ${id.value} deleted successfully`
      )
    } catch (error) {
      this.logger.error(
        `Failed to delete knowledge entry with id ${id.value}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to delete knowledge entry: ${error.message}`)
    }
  }

  async findAllTypes(userId: string): Promise<string[]> {
    try {
      const result = await this.db
        .selectDistinct({ type: knowledgeEntries.type })
        .from(knowledgeEntries)
        .where(eq(knowledgeEntries.userId, userId))
        .orderBy(knowledgeEntries.type)

      return result.map((r) => r.type)
    } catch (error) {
      this.logger.error(
        `Failed to find all knowledge types: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to find knowledge types: ${error.message}`)
    }
  }

  async findTopicsInType(userId: string, type: string): Promise<string[]> {
    try {
      const result = await this.db
        .select({ topic: knowledgeEntries.topic })
        .from(knowledgeEntries)
        .where(
          and(
            eq(knowledgeEntries.userId, userId),
            eq(knowledgeEntries.type, type)
          )
        )
        .orderBy(knowledgeEntries.topic)

      return result.map((r) => r.topic)
    } catch (error) {
      this.logger.error(
        `Failed to find topics in type ${type}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to find topics: ${error.message}`)
    }
  }

  async findByTopic(userId: string, topic: string): Promise<KnowledgeEntry[]> {
    try {
      const results = await this.db
        .select()
        .from(knowledgeEntries)
        .where(
          and(
            eq(knowledgeEntries.userId, userId),
            eq(knowledgeEntries.topic, topic)
          )
        )
        .orderBy(knowledgeEntries.type)

      return results.map((result) => this.mapToDomainEntity(result))
    } catch (error) {
      this.logger.error(
        `Failed to find knowledge entries by topic ${topic}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to find knowledge entries: ${error.message}`)
    }
  }

  async search(userId: string, query: string): Promise<KnowledgeEntry[]> {
    try {
      const searchPattern = `%${query.toLowerCase()}%`

      const results = await this.db
        .select()
        .from(knowledgeEntries)
        .where(
          and(
            eq(knowledgeEntries.userId, userId),
            or(
              like(knowledgeEntries.content, searchPattern),
              like(knowledgeEntries.type, searchPattern),
              like(knowledgeEntries.topic, searchPattern)
            )
          )
        )
        .orderBy(desc(knowledgeEntries.updatedAt))

      return results.map((result) => this.mapToDomainEntity(result))
    } catch (error) {
      this.logger.error(
        `Failed to search knowledge entries with query "${query}": ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to search knowledge entries: ${error.message}`)
    }
  }

  async searchByType(userId: string, type: string, query: string): Promise<KnowledgeEntry[]> {
    try {
      const searchPattern = `%${query.toLowerCase()}%`

      const results = await this.db
        .select()
        .from(knowledgeEntries)
        .where(
          and(
            eq(knowledgeEntries.userId, userId),
            eq(knowledgeEntries.type, type),
            or(
              like(knowledgeEntries.content, searchPattern),
              like(knowledgeEntries.topic, searchPattern)
            )
          )
        )
        .orderBy(desc(knowledgeEntries.updatedAt))

      return results.map((result) => this.mapToDomainEntity(result))
    } catch (error) {
      this.logger.error(
        `Failed to search knowledge entries by type ${type} with query "${query}": ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to search knowledge entries: ${error.message}`)
    }
  }

  async searchByTags(userId: string, tags: string[]): Promise<KnowledgeEntry[]> {
    try {
      const results = await this.db
        .select()
        .from(knowledgeEntries)
        .where(
          and(
            eq(knowledgeEntries.userId, userId),
            or(...tags.map((tag) => like(knowledgeEntries.tags, `%"${tag}"%`)))
          )
        )
        .orderBy(desc(knowledgeEntries.updatedAt))

      return results.map((result) => this.mapToDomainEntity(result))
    } catch (error) {
      this.logger.error(
        `Failed to search knowledge entries by tags ${tags.join(', ')}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to search knowledge entries: ${error.message}`)
    }
  }

  private mapToDbRecord(
    entry: KnowledgeEntry
  ): typeof knowledgeEntries.$inferInsert {
    return {
      id: entry.id.value,
      userId: entry.userId,
      type: entry.type,
      topic: entry.topic,
      key: entry.key,
      content: entry.content,
      tags: entry.tags || null,
      metadata: entry.metadata || null,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    }
  }

  private mapToDomainEntity(dbRecord: KnowledgeEntryRecord): KnowledgeEntry {
    const props: KnowledgeEntryProps = {
      id: new KnowledgeId(dbRecord.id),
      userId: dbRecord.userId,
      type: dbRecord.type,
      topic: dbRecord.topic,
      key: dbRecord.key,
      content: dbRecord.content,
      tags: dbRecord.tags || undefined,
      metadata: dbRecord.metadata || undefined,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt
    }

    return KnowledgeEntry.reconstitute(props)
  }
}
