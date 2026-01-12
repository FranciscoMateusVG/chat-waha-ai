import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleDatabaseService } from '../../../infrastructure/drizzle/database.provider'
import { systemPrompts } from '../../../infrastructure/drizzle/schemas/knowledge/system-prompt-schema'
import { SystemPrompt } from '../../domain/entities/system-prompt.entity'
import { SystemPromptRepository } from '../../domain/repositories/system-prompt.repository'

@Injectable()
export class DrizzleSystemPromptRepository implements SystemPromptRepository {
  constructor(private readonly databaseService: DrizzleDatabaseService) {}

  private get db() {
    return this.databaseService.getDatabase()
  }

  async save(prompt: SystemPrompt): Promise<void> {
    const record = {
      id: prompt.id,
      userId: prompt.userId,
      content: prompt.content,
      updatedAt: prompt.updatedAt
    }

    await this.db
      .insert(systemPrompts)
      .values(record)
      .onConflictDoUpdate({
        target: systemPrompts.userId,
        set: {
          content: record.content,
          updatedAt: record.updatedAt
        }
      })
  }

  async get(userId: string): Promise<SystemPrompt | null> {
    const result = await this.db
      .select()
      .from(systemPrompts)
      .where(eq(systemPrompts.userId, userId))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const record = result[0]
    return SystemPrompt.reconstitute({
      id: record.id,
      userId: record.userId,
      content: record.content,
      updatedAt: record.updatedAt
    })
  }

  async delete(userId: string): Promise<void> {
    await this.db
      .delete(systemPrompts)
      .where(eq(systemPrompts.userId, userId))
  }
}
