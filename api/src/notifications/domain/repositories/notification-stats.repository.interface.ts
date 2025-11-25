import {
  ChannelStatsResult,
  NotificationStatsResult
} from 'src/notifications/application'

export interface NotificationStatsRepository {
  getStats(query: any): Promise<NotificationStatsResult>
  getChannelStats(query: any): Promise<ChannelStatsResult[]>
  incrementSentCount(channel: string, date: Date): Promise<void>
  incrementSentCountBy(
    channel: string,
    date: Date,
    count: number
  ): Promise<void>
  incrementFailedCount(channel: string, date: Date): Promise<void>
  incrementDeliveredCount(channel: string, date: Date): Promise<void>
}
