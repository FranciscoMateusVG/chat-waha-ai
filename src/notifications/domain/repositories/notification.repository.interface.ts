import { Notification } from '../entities'

export interface NotificationRepository {
  save(notification: Notification): Promise<void>
  saveMany(notifications: Notification[]): Promise<void>
  findById(id: string): Promise<Notification | null>
  findByRecipientId(recipientId: string): Promise<Notification[]>
  findByStatus(status: string): Promise<Notification[]>
  update(notification: Notification): Promise<void>
  delete(id: string): Promise<void>
}
