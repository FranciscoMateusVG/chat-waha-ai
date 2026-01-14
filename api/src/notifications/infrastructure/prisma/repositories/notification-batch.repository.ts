import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service'
import { NotificationBatch } from '../../../domain/entities'
import { BatchId } from '../../../domain/entities/ids'
import { NotificationBatchRepository } from '../../../domain/repositories/notification-batch.repository.interface'
import {
  BatchStatus,
  NotificationChannel
} from '../../../domain/value-objects'

@Injectable()
export class PrismaNotificationBatchRepository implements NotificationBatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(batch: NotificationBatch): Promise<void> {
    const userId = batch.notifications.length > 0 ? batch.notifications[0].userId : 'system'

    await this.prisma.notificationBatch.create({
      data: {
        id: batch.id.value,
        userId,
        channel: batch.channel.value,
        status: batch.status.value,
        notificationCount: batch.notifications.length,
        createdAt: batch.createdAt,
        processedAt: batch.processedAt || null,
        errorMessage: null,
        updatedAt: new Date()
      }
    })
  }

  async findById(id: string): Promise<NotificationBatch | null> {
    const result = await this.prisma.notificationBatch.findUnique({
      where: { id }
    })

    if (!result) {
      return null
    }

    return this.mapToDomainEntity(result)
  }

  async findByStatus(status: string): Promise<NotificationBatch[]> {
    const results = await this.prisma.notificationBatch.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' }
    })

    return results.map((result) => this.mapToDomainEntity(result))
  }

  async findByChannel(channel: string): Promise<NotificationBatch[]> {
    const results = await this.prisma.notificationBatch.findMany({
      where: { channel },
      orderBy: { createdAt: 'desc' }
    })

    return results.map((result) => this.mapToDomainEntity(result))
  }

  async update(batch: NotificationBatch): Promise<void> {
    await this.prisma.notificationBatch.update({
      where: { id: batch.id.value },
      data: {
        channel: batch.channel.value,
        status: batch.status.value,
        notificationCount: batch.notifications.length,
        processedAt: batch.processedAt || null,
        errorMessage: null,
        updatedAt: new Date()
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notificationBatch.delete({
      where: { id }
    })
  }

  private mapToDomainEntity(dbRecord: any): NotificationBatch {
    const props = {
      id: new BatchId(dbRecord.id),
      channel: new NotificationChannel(dbRecord.channel),
      notifications: [],
      status: new BatchStatus(dbRecord.status),
      createdAt: dbRecord.createdAt,
      processedAt: dbRecord.processedAt
    }

    return new NotificationBatch(props)
  }
}
