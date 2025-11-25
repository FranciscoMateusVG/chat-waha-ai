import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, gte, lte } from 'drizzle-orm'
import { DrizzleDatabaseService } from 'src/infrastructure/drizzle/database.provider'
import { notificationHistory } from '../../../../../infrastructure/drizzle/schemas/notification/schema'
import {
  NotificationHistoryQuery,
  NotificationHistoryReadModel,
  NotificationHistoryResult
} from '../../../../application/read-models/notification-history.read-model'
import { NotificationHistoryRepository } from '../../../../domain/repositories/notification-history.repository.interface'

@Injectable()
export class DrizzleNotificationHistoryRepository
  implements NotificationHistoryRepository
{
  constructor(private readonly databaseService: DrizzleDatabaseService) {}

  private get db() {
    return this.databaseService.getDatabase()
  }

  async getHistory(
    query: NotificationHistoryQuery
  ): Promise<NotificationHistoryResult> {
    const conditions = []

    if (query.recipientId) {
      conditions.push(eq(notificationHistory.recipientId, query.recipientId))
    }

    if (query.channel) {
      conditions.push(eq(notificationHistory.channel, query.channel))
    }

    if (query.status) {
      conditions.push(eq(notificationHistory.status, query.status))
    }

    if (query.startDate) {
      conditions.push(gte(notificationHistory.createdAt, query.startDate))
    }

    if (query.endDate) {
      conditions.push(lte(notificationHistory.createdAt, query.endDate))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const totalResult = await this.db
      .select({ count: count() })
      .from(notificationHistory)
      .where(whereClause)

    const total = totalResult[0]?.count || 0

    // Get paginated results
    const limit = query.limit || 50
    const offset = query.offset || 0

    const results = await this.db
      .select()
      .from(notificationHistory)
      .where(whereClause)
      .orderBy(desc(notificationHistory.createdAt))
      .limit(limit)
      .offset(offset)

    const notifications: NotificationHistoryReadModel[] = results.map(
      (result) => ({
        notificationId: result.notificationId,
        recipientId: result.recipientId,
        channel: result.channel,
        status: result.status,
        title: result.title,
        body: result.body,
        createdAt: result.createdAt,
        sentAt: result.sentAt,
        failedReason: result.failedReason,
        metadata: result.metadata
          ? JSON.parse(result.metadata as string)
          : undefined
      })
    )

    return {
      notifications,
      total,
      hasMore: offset + limit < total
    }
  }

  async createFromNotification(
    notificationId: string,
    recipientId: string,
    channel: string,
    status: string,
    title: string,
    body: string,
    metadata?: Record<string, any>,
    sentAt?: Date,
    failedReason?: string
  ): Promise<void> {
    const historyData = {
      notificationId,
      recipientId,
      channel,
      status,
      title,
      body,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
      sentAt: sentAt || null,
      failedReason: failedReason || null
    }

    await this.db.insert(notificationHistory).values(historyData)
  }

  async updateStatus(
    notificationId: string,
    status: string,
    sentAt?: Date,
    failedReason?: string
  ): Promise<void> {
    const updateData: any = {
      status
    }

    if (sentAt) {
      updateData.sentAt = sentAt
    }

    if (failedReason) {
      updateData.failedReason = failedReason
    }

    await this.db
      .update(notificationHistory)
      .set(updateData)
      .where(eq(notificationHistory.notificationId, notificationId))
  }
}
