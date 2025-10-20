import { Injectable } from '@nestjs/common'
import { desc, eq } from 'drizzle-orm'
import { DrizzleDatabaseService } from 'src/infrastructure/drizzle/database.provider'
import { notificationBatches } from '../../../../../infrastructure/drizzle/schemas/notification/schema'
import { NotificationBatch } from '../../../../domain/entities'
import { BatchId } from '../../../../domain/entities/ids'
import { NotificationBatchRepository } from '../../../../domain/repositories/notification-batch.repository.interface'
import {
  BatchStatus,
  NotificationChannel
} from '../../../../domain/value-objects'

@Injectable()
export class DrizzleNotificationBatchRepository
  implements NotificationBatchRepository
{
  constructor(private readonly databaseService: DrizzleDatabaseService) {}

  private get db() {
    return this.databaseService.getDatabase()
  }

  async save(batch: NotificationBatch): Promise<void> {
    const batchData = {
      id: batch.id.value,
      channel: batch.channel.value,
      status: batch.status.value,
      notificationCount: batch.notifications.length,
      createdAt: batch.createdAt,
      processedAt: batch.processedAt || null,
      errorMessage: null,
      updatedAt: new Date()
    }

    await this.db.insert(notificationBatches).values(batchData)
  }

  async findById(id: string): Promise<NotificationBatch | null> {
    const result = await this.db
      .select()
      .from(notificationBatches)
      .where(eq(notificationBatches.id, id))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapToDomainEntity(result[0])
  }

  async findByStatus(status: string): Promise<NotificationBatch[]> {
    const results = await this.db
      .select()
      .from(notificationBatches)
      .where(eq(notificationBatches.status, status))
      .orderBy(desc(notificationBatches.createdAt))

    return results.map((result) => this.mapToDomainEntity(result))
  }

  async findByChannel(channel: string): Promise<NotificationBatch[]> {
    const results = await this.db
      .select()
      .from(notificationBatches)
      .where(eq(notificationBatches.channel, channel))
      .orderBy(desc(notificationBatches.createdAt))

    return results.map((result) => this.mapToDomainEntity(result))
  }

  async update(batch: NotificationBatch): Promise<void> {
    const updateData = {
      channel: batch.channel.value,
      status: batch.status.value,
      notificationCount: batch.notifications.length,
      processedAt: batch.processedAt || null,
      errorMessage: null,
      updatedAt: new Date()
    }

    await this.db
      .update(notificationBatches)
      .set(updateData)
      .where(eq(notificationBatches.id, batch.id.value))
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(notificationBatches)
      .where(eq(notificationBatches.id, id))
  }

  private mapToDomainEntity(dbRecord: any): NotificationBatch {
    const props = {
      id: new BatchId(dbRecord.id),
      channel: new NotificationChannel(dbRecord.channel),
      notifications: [], // Note: This would need to be populated from notifications table if needed
      status: new BatchStatus(dbRecord.status),
      createdAt: dbRecord.createdAt,
      processedAt: dbRecord.processedAt
    }

    return new NotificationBatch(props)
  }
}
