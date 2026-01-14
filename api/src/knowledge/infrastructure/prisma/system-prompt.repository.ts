import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../infrastructure/prisma/prisma.service'
import { SystemPrompt } from '../../domain/entities/system-prompt.entity'
import { SystemPromptRepository } from '../../domain/repositories/system-prompt.repository'

@Injectable()
export class PrismaSystemPromptRepository implements SystemPromptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(prompt: SystemPrompt): Promise<void> {
    await this.prisma.systemPrompt.upsert({
      where: { userId: prompt.userId },
      create: {
        id: prompt.id,
        userId: prompt.userId,
        content: prompt.content,
        updatedAt: prompt.updatedAt
      },
      update: {
        content: prompt.content,
        updatedAt: prompt.updatedAt
      }
    })
  }

  async get(userId: string): Promise<SystemPrompt | null> {
    const result = await this.prisma.systemPrompt.findUnique({
      where: { userId }
    })

    if (!result) {
      return null
    }

    return SystemPrompt.reconstitute({
      id: result.id,
      userId: result.userId,
      content: result.content,
      updatedAt: result.updatedAt
    })
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.systemPrompt.deleteMany({
      where: { userId }
    })
  }
}
