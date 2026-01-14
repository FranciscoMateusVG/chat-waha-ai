import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../infrastructure/prisma/prisma.service'
import { KnowledgeEntry as PrismaKnowledgeEntry } from '@prisma/generated'
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
export class PrismaKnowledgeRepository implements KnowledgeRepository {
  private readonly logger = new Logger(PrismaKnowledgeRepository.name)

  constructor(private readonly prisma: PrismaService) {}

  async save(entry: KnowledgeEntry): Promise<void> {
    try {
      const entryData = this.mapToDbRecord(entry)

      await this.prisma.knowledgeEntry.upsert({
        where: {
          userId_key: {
            userId: entryData.userId,
            key: entryData.key
          }
        },
        create: entryData,
        update: {
          content: entryData.content,
          tags: entryData.tags,
          metadata: entryData.metadata,
          updatedAt: new Date()
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
      const result = await this.prisma.knowledgeEntry.findFirst({
        where: {
          userId,
          id: id.value
        }
      })

      if (!result) {
        return null
      }

      return this.mapToDomainEntity(result)
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
      const result = await this.prisma.knowledgeEntry.findUnique({
        where: {
          userId_key: {
            userId,
            key
          }
        }
      })

      if (!result) {
        return null
      }

      return this.mapToDomainEntity(result)
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
      const records = await this.prisma.knowledgeEntry.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      })

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
      const skip = (page - 1) * limit

      const [totalCount, records] = await Promise.all([
        this.prisma.knowledgeEntry.count({ where: { userId } }),
        this.prisma.knowledgeEntry.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit
        })
      ])

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
      await this.prisma.knowledgeEntry.deleteMany({
        where: {
          userId,
          id: id.value
        }
      })
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
      const result = await this.prisma.knowledgeEntry.findMany({
        where: { userId },
        select: { type: true },
        distinct: ['type'],
        orderBy: { type: 'asc' }
      })

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
      const result = await this.prisma.knowledgeEntry.findMany({
        where: { userId, type },
        select: { topic: true },
        orderBy: { topic: 'asc' }
      })

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
      const results = await this.prisma.knowledgeEntry.findMany({
        where: { userId, topic },
        orderBy: { type: 'asc' }
      })

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

      const results = await this.prisma.knowledgeEntry.findMany({
        where: {
          userId,
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { type: { contains: query, mode: 'insensitive' } },
            { topic: { contains: query, mode: 'insensitive' } }
          ]
        },
        orderBy: { updatedAt: 'desc' }
      })

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
      const results = await this.prisma.knowledgeEntry.findMany({
        where: {
          userId,
          type,
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { topic: { contains: query, mode: 'insensitive' } }
          ]
        },
        orderBy: { updatedAt: 'desc' }
      })

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
      // For PostgreSQL with JSON, we filter by checking if tags array contains any of the specified tags
      const results = await this.prisma.knowledgeEntry.findMany({
        where: {
          userId,
          tags: { not: null }
        },
        orderBy: { updatedAt: 'desc' }
      })

      // Filter in memory since Prisma doesn't support JSON array contains natively
      const filtered = results.filter(result => {
        const entryTags = result.tags as string[] | null
        if (!entryTags) return false
        return tags.some(tag => entryTags.includes(tag))
      })

      return filtered.map((result) => this.mapToDomainEntity(result))
    } catch (error) {
      this.logger.error(
        `Failed to search knowledge entries by tags ${tags.join(', ')}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to search knowledge entries: ${error.message}`)
    }
  }

  private mapToDbRecord(entry: KnowledgeEntry) {
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

  private mapToDomainEntity(dbRecord: PrismaKnowledgeEntry): KnowledgeEntry {
    const props: KnowledgeEntryProps = {
      id: new KnowledgeId(dbRecord.id),
      userId: dbRecord.userId,
      type: dbRecord.type,
      topic: dbRecord.topic,
      key: dbRecord.key,
      content: dbRecord.content,
      tags: dbRecord.tags as string[] | undefined,
      metadata: dbRecord.metadata as Record<string, unknown> | undefined,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt
    }

    return KnowledgeEntry.reconstitute(props)
  }
}
