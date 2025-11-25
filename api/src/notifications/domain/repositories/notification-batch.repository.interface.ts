import { NotificationBatch } from '../entities'

export interface NotificationBatchRepository {
  save(batch: NotificationBatch): Promise<void>
  findById(id: string): Promise<NotificationBatch | null>
  findByStatus(status: string): Promise<NotificationBatch[]>
  findByChannel(channel: string): Promise<NotificationBatch[]>
  update(batch: NotificationBatch): Promise<void>
  delete(id: string): Promise<void>
}
