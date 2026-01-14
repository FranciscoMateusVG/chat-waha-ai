import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service'
import {
  ChannelStatsResult,
  NotificationStatsQuery,
  NotificationStatsResult
} from '../../../application/read-models/notification-stats.read-model'
import { NotificationStatsRepository } from '../../../domain/repositories/notification-stats.repository.interface'

@Injectable()
export class PrismaNotificationStatsRepository implements NotificationStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(query: NotificationStatsQuery): Promise<NotificationStatsResult> {
    const where: any = {}

    if (query.channel) {
      where.channel = query.channel
    }

    if (query.startDate || query.endDate) {
      where.date = {}
      if (query.startDate) {
        where.date.gte = query.startDate.toISOString().split('T')[0]
      }
      if (query.endDate) {
        where.date.lte = query.endDate.toISOString().split('T')[0]
      }
    }

    const results = await this.prisma.notificationStats.findMany({
      where,
      orderBy: { date: 'desc' }
    })

    const stats = results.map((result) => ({
      date: result.date,
      channel: result.channel,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      totalDelivered: result.totalDelivered
    }))

    const totalSent = stats.reduce((sum, stat) => sum + stat.totalSent, 0)
    const totalFailed = stats.reduce((sum, stat) => sum + stat.totalFailed, 0)
    const totalDelivered = stats.reduce((sum, stat) => sum + stat.totalDelivered, 0)
    const successRate = totalSent > 0 ? totalDelivered / totalSent : 0

    return {
      stats,
      summary: {
        totalSent,
        totalFailed,
        totalDelivered,
        successRate
      }
    }
  }

  async getChannelStats(query: NotificationStatsQuery): Promise<ChannelStatsResult[]> {
    const where: any = {}

    if (query.channel) {
      where.channel = query.channel
    }

    if (query.startDate || query.endDate) {
      where.date = {}
      if (query.startDate) {
        where.date.gte = query.startDate.toISOString().split('T')[0]
      }
      if (query.endDate) {
        where.date.lte = query.endDate.toISOString().split('T')[0]
      }
    }

    const results = await this.prisma.notificationStats.groupBy({
      by: ['channel'],
      where,
      _sum: {
        totalSent: true,
        totalFailed: true,
        totalDelivered: true
      }
    })

    return results.map((result) => {
      const totalSent = result._sum.totalSent || 0
      const totalFailed = result._sum.totalFailed || 0
      const totalDelivered = result._sum.totalDelivered || 0
      const successRate = totalSent > 0 ? totalDelivered / totalSent : 0

      return {
        channel: result.channel,
        totalSent,
        totalFailed,
        totalDelivered,
        successRate,
        averageDeliveryTime: undefined
      }
    })
  }

  async incrementSentCount(userId: string, channel: string, date: Date): Promise<void> {
    const dateStr = date.toISOString().split('T')[0]
    const id = `${userId}-${dateStr}-${channel}`

    await this.prisma.notificationStats.upsert({
      where: { id },
      create: {
        id,
        userId,
        date: dateStr,
        channel,
        totalSent: 1,
        totalFailed: 0,
        totalDelivered: 0,
        updatedAt: new Date()
      },
      update: {
        totalSent: { increment: 1 },
        updatedAt: new Date()
      }
    })
  }

  async incrementSentCountBy(
    userId: string,
    channel: string,
    date: Date,
    count: number
  ): Promise<void> {
    const dateStr = date.toISOString().split('T')[0]
    const id = `${userId}-${dateStr}-${channel}`

    await this.prisma.notificationStats.upsert({
      where: { id },
      create: {
        id,
        userId,
        date: dateStr,
        channel,
        totalSent: count,
        totalFailed: 0,
        totalDelivered: 0,
        updatedAt: new Date()
      },
      update: {
        totalSent: { increment: count },
        updatedAt: new Date()
      }
    })
  }

  async incrementFailedCount(userId: string, channel: string, date: Date): Promise<void> {
    const dateStr = date.toISOString().split('T')[0]
    const id = `${userId}-${dateStr}-${channel}`

    await this.prisma.notificationStats.upsert({
      where: { id },
      create: {
        id,
        userId,
        date: dateStr,
        channel,
        totalSent: 0,
        totalFailed: 1,
        totalDelivered: 0,
        updatedAt: new Date()
      },
      update: {
        totalFailed: { increment: 1 },
        updatedAt: new Date()
      }
    })
  }

  async incrementDeliveredCount(userId: string, channel: string, date: Date): Promise<void> {
    const dateStr = date.toISOString().split('T')[0]
    const id = `${userId}-${dateStr}-${channel}`

    await this.prisma.notificationStats.upsert({
      where: { id },
      create: {
        id,
        userId,
        date: dateStr,
        channel,
        totalSent: 0,
        totalFailed: 0,
        totalDelivered: 1,
        updatedAt: new Date()
      },
      update: {
        totalDelivered: { increment: 1 },
        updatedAt: new Date()
      }
    })
  }
}
