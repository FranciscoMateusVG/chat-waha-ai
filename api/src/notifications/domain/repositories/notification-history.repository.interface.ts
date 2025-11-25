import {
  NotificationHistoryQuery,
  NotificationHistoryResult
} from 'src/notifications/application'

// These will be implemented in the infrastructure layer
export interface NotificationHistoryRepository {
  getHistory(
    query: NotificationHistoryQuery
  ): Promise<NotificationHistoryResult>
  createFromNotification(
    notificationId: string,
    recipientId: string,
    channel: string,
    status: string,
    title: string,
    body: string,
    metadata?: Record<string, any>,
    sentAt?: Date,
    failedReason?: string
  ): Promise<void>
  updateStatus(
    notificationId: string,
    status: string,
    sentAt?: Date,
    failedReason?: string
  ): Promise<void>
}
