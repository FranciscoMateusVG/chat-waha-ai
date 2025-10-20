import { Injectable } from '@nestjs/common'
import { and, desc, eq, gte, lte, sql, sum } from 'drizzle-orm'
import { DrizzleDatabaseService } from 'src/infrastructure/drizzle/database.provider'
import { notificationStats } from '../../../../../infrastructure/drizzle/schemas/notification/schema'
import {
  ChannelStatsResult,
  NotificationStatsQuery,
  NotificationStatsResult
} from '../../../../application/read-models/notification-stats.read-model'
import { NotificationStatsRepository } from '../../../../domain/repositories/notification-stats.repository.interface'

@Injectable()
export class DrizzleNotificationStatsRepository
  implements NotificationStatsRepository
{
  constructor(private readonly databaseService: DrizzleDatabaseService) {}

  private get db() {
    return this.databaseService.getDatabase()
  }

  async getStats(
    query: NotificationStatsQuery
  ): Promise<NotificationStatsResult> {
    const conditions = []

    if (query.channel) {
      conditions.push(eq(notificationStats.channel, query.channel))
    }

    if (query.startDate) {
      const startDateStr = query.startDate.toISOString().split('T')[0]
      conditions.push(gte(notificationStats.date, startDateStr))
    }

    if (query.endDate) {
      const endDateStr = query.endDate.toISOString().split('T')[0]
      conditions.push(lte(notificationStats.date, endDateStr))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const results = await this.db
      .select()
      .from(notificationStats)
      .where(whereClause)
      .orderBy(desc(notificationStats.date))

    const stats = results.map((result) => ({
      date: result.date,
      channel: result.channel,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      totalDelivered: result.totalDelivered
    }))

    // Calculate summary
    const totalSent = stats.reduce((sum, stat) => sum + stat.totalSent, 0)
    const totalFailed = stats.reduce((sum, stat) => sum + stat.totalFailed, 0)
    const totalDelivered = stats.reduce(
      (sum, stat) => sum + stat.totalDelivered,
      0
    )
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

  async getChannelStats(
    query: NotificationStatsQuery
  ): Promise<ChannelStatsResult[]> {
    const conditions = []

    if (query.channel) {
      conditions.push(eq(notificationStats.channel, query.channel))
    }

    if (query.startDate) {
      const startDateStr = query.startDate.toISOString().split('T')[0]
      conditions.push(gte(notificationStats.date, startDateStr))
    }

    if (query.endDate) {
      const endDateStr = query.endDate.toISOString().split('T')[0]
      conditions.push(lte(notificationStats.date, endDateStr))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const results = await this.db
      .select({
        channel: notificationStats.channel,
        totalSent: sum(notificationStats.totalSent),
        totalFailed: sum(notificationStats.totalFailed),
        totalDelivered: sum(notificationStats.totalDelivered)
      })
      .from(notificationStats)
      .where(whereClause)
      .groupBy(notificationStats.channel)

    return results.map((result) => {
      const totalSent = Number(result.totalSent) || 0
      const totalFailed = Number(result.totalFailed) || 0
      const totalDelivered = Number(result.totalDelivered) || 0
      const successRate = totalSent > 0 ? totalDelivered / totalSent : 0

      return {
        channel: result.channel,
        totalSent,
        totalFailed,
        totalDelivered,
        successRate,
        averageDeliveryTime: undefined // This would need to be calculated from actual delivery times
      }
    })
  }

  async incrementSentCount(channel: string, date: Date): Promise<void> {
    const dateStr = date.toISOString().split('T')[0]
    const id = `${dateStr}-${channel}`

    await this.db
      .insert(notificationStats)
      .values({
        id,
        date: dateStr,
        channel,
        totalSent: 1,
        totalFailed: 0,
        totalDelivered: 0,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: notificationStats.id,
        set: {
          totalSent: sql`${notificationStats.totalSent} + 1`,
          updatedAt: new Date()
        }
      })
  }

  async incrementSentCountBy(
    channel: string,
    date: Date,
    count: number
  ): Promise<void> {
    const dateStr = date.toISOString().split('T')[0]
    const id = `${dateStr}-${channel}`

    await this.db
      .insert(notificationStats)
      .values({
        id,
        date: dateStr,
        channel,
        totalSent: count,
        totalFailed: 0,
        totalDelivered: 0,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: notificationStats.id,
        set: {
          totalSent: sql`${notificationStats.totalSent} + ${count}`,
          updatedAt: new Date()
        }
      })
  }

  async incrementFailedCount(channel: string, date: Date): Promise<void> {
    const dateStr = date.toISOString().split('T')[0]
    const id = `${dateStr}-${channel}`

    await this.db
      .insert(notificationStats)
      .values({
        id,
        date: dateStr,
        channel,
        totalSent: 0,
        totalFailed: 1,
        totalDelivered: 0,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: notificationStats.id,
        set: {
          totalFailed: sql`${notificationStats.totalFailed} + 1`,
          updatedAt: new Date()
        }
      })
  }

  async incrementDeliveredCount(channel: string, date: Date): Promise<void> {
    const dateStr = date.toISOString().split('T')[0]
    const id = `${dateStr}-${channel}`

    await this.db
      .insert(notificationStats)
      .values({
        id,
        date: dateStr,
        channel,
        totalSent: 0,
        totalFailed: 0,
        totalDelivered: 1,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: notificationStats.id,
        set: {
          totalDelivered: sql`${notificationStats.totalDelivered} + 1`,
          updatedAt: new Date()
        }
      })
  }
}
