import { Logger } from '@nestjs/common'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { NotificationFailedEvent } from '../../domain/events'

@EventsHandler(NotificationFailedEvent)
export class NotificationFailedEventHandler
  implements IEventHandler<NotificationFailedEvent>
{
  private readonly logger = new Logger(NotificationFailedEventHandler.name)

  async handle(event: NotificationFailedEvent): Promise<void> {
    this.logger.error(
      `Notification failed: ${event.notificationId.value} ` +
        `to user ${event.recipientId.value} via ${event.channel.value} ` +
        `at ${event.failedAt.toISOString()}. Error: ${event.errorMessage}`
    )

    // TODO: Update read models and handle failure logic here
    // This handler should:
    // 1. Update NotificationHistoryReadModel with failure status
    // 2. Update NotificationStatsReadModel with failure count
    // 3. Trigger retry mechanisms if applicable
    // 4. Send alerts to administrators for critical failures
    // 5. Log detailed error information for debugging

    // Example:
    // await this.notificationHistoryRepository.updateStatus(
    //   event.notificationId.value,
    //   'failed',
    //   event.failedAt,
    //   event.errorMessage
    // );
    //
    // await this.notificationStatsRepository.incrementFailedCount(
    //   event.channel.value,
    //   event.failedAt
    // );
    //
    // // Trigger retry if this is a transient error
    // if (this.isRetriableError(event.errorMessage)) {
    //   await this.retryService.scheduleRetry(event.notificationId.value);
    // }
    //
    // // Alert administrators for critical failures
    // if (this.isCriticalError(event.errorMessage)) {
    //   await this.alertService.sendAdminAlert(
    //     `Critical notification failure: ${event.errorMessage}`
    //   );
    // }
  }

  // TODO: Implement error classification methods
  // private isRetriableError(errorMessage: string): boolean {
  //   const retriableErrors = [
  //     'network timeout',
  //     'service unavailable',
  //     'rate limit exceeded'
  //   ];
  //   return retriableErrors.some(error =>
  //     errorMessage.toLowerCase().includes(error)
  //   );
  // }
  //
  // private isCriticalError(errorMessage: string): boolean {
  //   const criticalErrors = [
  //     'authentication failed',
  //     'service configuration error',
  //     'database connection failed'
  //   ];
  //   return criticalErrors.some(error =>
  //     errorMessage.toLowerCase().includes(error)
  //   );
  // }
}
