import { Inject, Logger } from '@nestjs/common'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { NotificationHistoryRepository } from 'src/notifications/domain/repositories/notification-history.repository.interface'
import { NotificationStatsRepository } from 'src/notifications/domain/repositories/notification-stats.repository.interface'
import { NotificationSentEvent } from '../../domain/events'
import {
  NOTIFICATION_HISTORY_REPOSITORY,
  NOTIFICATION_STATS_REPOSITORY
} from '../../tokens'
@EventsHandler(NotificationSentEvent)
export class NotificationSentEventHandler
  implements IEventHandler<NotificationSentEvent>
{
  private readonly logger = new Logger(NotificationSentEventHandler.name)

  constructor(
    @Inject(NOTIFICATION_HISTORY_REPOSITORY)
    private readonly notificationHistoryRepository: NotificationHistoryRepository,
    @Inject(NOTIFICATION_STATS_REPOSITORY)
    private readonly notificationStatsRepository: NotificationStatsRepository
  ) {}

  async handle(event: NotificationSentEvent): Promise<void> {
    this.logger.log(
      `Notification sent successfully: ${event.notificationId.value} ` +
        `to user ${event.recipientId.value} via ${event.channel.value} ` +
        `at ${event.sentAt.toISOString()}`
    )

    try {
      // Update notification history read model
      await this.updateNotificationHistory(event)

      // Update notification stats read model
      await this.updateNotificationStats(event)

      this.logger.log(
        `Successfully updated read models for notification: ${event.notificationId.value}`
      )
    } catch (error) {
      // Log error but don't retry - this is a read model update failure
      this.logger.error(
        `Failed to update read models for notification ${event.notificationId.value}: ${error.message}`,
        error.stack
      )
    }
  }

  private async updateNotificationHistory(
    event: NotificationSentEvent
  ): Promise<void> {
    await this.notificationHistoryRepository.createFromNotification(
      event.userId,
      event.notificationId.value,
      event.recipientId.value,
      event.channel.value,
      'sent',
      event.title,
      event.body,
      undefined, // metadata
      event.sentAt
    )
  }

  private async updateNotificationStats(
    event: NotificationSentEvent
  ): Promise<void> {
    await this.notificationStatsRepository.incrementSentCount(
      event.userId,
      event.channel.value,
      event.sentAt
    )
  }
}
