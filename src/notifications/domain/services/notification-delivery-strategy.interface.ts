import { Notification } from '../entities/notification.entity';
import { NotificationBatch } from '../entities/notification-batch.entity';

export interface NotificationDeliveryStrategy {
  deliverSingle(notification: Notification): Promise<void>;
  deliverBatch(batch: NotificationBatch): Promise<void>;
  supportsBatch(): boolean;
}