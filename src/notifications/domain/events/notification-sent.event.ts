import { IEvent } from '@nestjs/cqrs'
import { Notification, NotificationId, UserId } from '../entities'
import { NotificationChannel } from '../value-objects'

export class NotificationSentEvent implements IEvent {
  public readonly notificationId: NotificationId
  public readonly recipientId: UserId
  public readonly channel: NotificationChannel
  public readonly title: string
  public readonly body: string
  public readonly sentAt: Date

  constructor(notification: Notification) {
    this.notificationId = notification.id
    this.recipientId = notification.recipientId
    this.channel = notification.channel
    this.title = notification.content.title
    this.body = notification.content.body
    this.sentAt = notification.sentAt!
  }
}
