import {
  ChannelStatsResult,
  NotificationStatsResult
} from 'src/notifications/application'

export interface NotificationStatsRepository {
  getStats(query: any): Promise<NotificationStatsResult>
  getChannelStats(query: any): Promise<ChannelStatsResult[]>
  incrementSentCount(userId: string, channel: string, date: Date): Promise<void>
  incrementSentCountBy(
    userId: string,
    channel: string,
    date: Date,
    count: number
  ): Promise<void>
  incrementFailedCount(userId: string, channel: string, date: Date): Promise<void>
  incrementDeliveredCount(userId: string, channel: string, date: Date): Promise<void>
}
