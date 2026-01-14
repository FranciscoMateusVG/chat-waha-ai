import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service'
import {
  NotificationHistoryQuery,
  NotificationHistoryReadModel,
  NotificationHistoryResult
} from '../../../application/read-models/notification-history.read-model'
import { NotificationHistoryRepository } from '../../../domain/repositories/notification-history.repository.interface'

@Injectable()
export class PrismaNotificationHistoryRepository implements NotificationHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(query: NotificationHistoryQuery): Promise<NotificationHistoryResult> {
    const where: any = {}

    if (query.recipientId) {
      where.recipientId = query.recipientId
    }

    if (query.channel) {
      where.channel = query.channel
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) {
        where.createdAt.gte = query.startDate
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate
      }
    }

    const limit = query.limit || 50
    const offset = query.offset || 0

    const [total, results] = await Promise.all([
      this.prisma.notificationHistory.count({ where }),
      this.prisma.notificationHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })
    ])

    const notifications: NotificationHistoryReadModel[] = results.map((result) => ({
      notificationId: result.notificationId,
      recipientId: result.recipientId,
      channel: result.channel,
      status: result.status,
      title: result.title,
      body: result.body,
      createdAt: result.createdAt,
      sentAt: result.sentAt,
      failedReason: result.failedReason,
      metadata: result.metadata as Record<string, unknown> | undefined
    }))

    return {
      notifications,
      total,
      hasMore: offset + limit < total
    }
  }

  async createFromNotification(
    userId: string,
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
    await this.prisma.notificationHistory.create({
      data: {
        userId,
        notificationId,
        recipientId,
        channel,
        status,
        title,
        body,
        metadata: metadata || null,
        createdAt: new Date(),
        sentAt: sentAt || null,
        failedReason: failedReason || null
      }
    })
  }

  async updateStatus(
    notificationId: string,
    status: string,
    sentAt?: Date,
    failedReason?: string
  ): Promise<void> {
    const updateData: any = { status }

    if (sentAt) {
      updateData.sentAt = sentAt
    }

    if (failedReason) {
      updateData.failedReason = failedReason
    }

    await this.prisma.notificationHistory.update({
      where: { notificationId },
      data: updateData
    })
  }
}
