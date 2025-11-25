import { Notification, NotificationBatch } from '../../entities'

export interface EmailVendor {
  send(notification: Notification): Promise<void>
  sendBatch(
    batch: NotificationBatch
  ): Promise<{ successEmails: Notification[]; failedEmails: Notification[] }>
}
