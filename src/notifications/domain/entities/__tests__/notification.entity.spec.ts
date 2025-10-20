import { Notification } from '../notification.entity';
import { NotificationId, UserId, BatchId } from '../ids';
import { NotificationChannel, NotificationContent, NotificationStatus } from '../../value-objects';

describe('Notification Entity', () => {
  const createTestNotification = () => {
    const recipientId = new UserId('user-123');
    const content = new NotificationContent('Test Title', 'Test body message');
    const channel = NotificationChannel.email();
    
    return Notification.create(recipientId, content, channel);
  };

  describe('create', () => {
    it('should create a notification with pending status', () => {
      const notification = createTestNotification();
      
      expect(notification.id).toBeInstanceOf(NotificationId);
      expect(notification.status.isPending()).toBe(true);
      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.sentAt).toBeUndefined();
      expect(notification.batchId).toBeUndefined();
    });

    it('should create notification with correct properties', () => {
      const recipientId = new UserId('user-123');
      const content = new NotificationContent('Test Title', 'Test body');
      const channel = NotificationChannel.whatsapp();
      
      const notification = Notification.create(recipientId, content, channel);
      
      expect(notification.recipientId.equals(recipientId)).toBe(true);
      expect(notification.content.equals(content)).toBe(true);
      expect(notification.channel.equals(channel)).toBe(true);
    });
  });

  describe('canBeSent', () => {
    it('should return true when notification is pending', () => {
      const notification = createTestNotification();
      expect(notification.canBeSent()).toBe(true);
    });

    it('should return false when notification is already sent', () => {
      const notification = createTestNotification();
      notification.markAsSent();
      expect(notification.canBeSent()).toBe(false);
    });
  });

  describe('canBeAssignedToBatch', () => {
    it('should return true when notification is pending and not in batch', () => {
      const notification = createTestNotification();
      expect(notification.canBeAssignedToBatch()).toBe(true);
    });

    it('should return false when notification is not pending', () => {
      const notification = createTestNotification();
      notification.markAsSent();
      expect(notification.canBeAssignedToBatch()).toBe(false);
    });

    it('should return false when notification is already in batch', () => {
      const notification = createTestNotification();
      const batchId = BatchId.generate();
      notification.assignToBatch(batchId);
      expect(notification.canBeAssignedToBatch()).toBe(false);
    });
  });

  describe('assignToBatch', () => {
    it('should assign notification to batch when conditions are met', () => {
      const notification = createTestNotification();
      const batchId = BatchId.generate();
      
      notification.assignToBatch(batchId);
      
      expect(notification.batchId?.equals(batchId)).toBe(true);
    });

    it('should throw error when notification cannot be assigned to batch', () => {
      const notification = createTestNotification();
      notification.markAsSent();
      const batchId = BatchId.generate();
      
      expect(() => notification.assignToBatch(batchId)).toThrow(
        'Notification cannot be assigned to batch. Must be pending and not already in a batch.'
      );
    });
  });

  describe('markAsSent', () => {
    it('should mark pending notification as sent', () => {
      const notification = createTestNotification();
      
      notification.markAsSent();
      
      expect(notification.status.isSent()).toBe(true);
      expect(notification.sentAt).toBeInstanceOf(Date);
    });

    it('should throw error when notification is not pending', () => {
      const notification = createTestNotification();
      notification.markAsSent();
      
      expect(() => notification.markAsSent()).toThrow(
        'Notification cannot be sent. Must be in pending state.'
      );
    });
  });

  describe('markAsDelivered', () => {
    it('should mark sent notification as delivered', () => {
      const notification = createTestNotification();
      notification.markAsSent();
      
      notification.markAsDelivered();
      
      expect(notification.status.isDelivered()).toBe(true);
    });

    it('should throw error when notification is not sent', () => {
      const notification = createTestNotification();
      
      expect(() => notification.markAsDelivered()).toThrow(
        'Notification must be sent before it can be delivered'
      );
    });
  });

  describe('markAsFailed', () => {
    it('should mark pending notification as failed', () => {
      const notification = createTestNotification();
      const errorMessage = 'Network timeout';
      
      notification.markAsFailed(errorMessage);
      
      expect(notification.status.isFailed()).toBe(true);
      expect(notification.status.errorMessage).toBe(errorMessage);
    });

    it('should mark sent notification as failed', () => {
      const notification = createTestNotification();
      notification.markAsSent();
      const errorMessage = 'Delivery failed';
      
      notification.markAsFailed(errorMessage);
      
      expect(notification.status.isFailed()).toBe(true);
      expect(notification.status.errorMessage).toBe(errorMessage);
    });
  });

  describe('fromPersistence', () => {
    it('should recreate notification from persistence data', () => {
      const id = NotificationId.generate();
      const recipientId = new UserId('user-123');
      const content = new NotificationContent('Test Title', 'Test body');
      const channel = NotificationChannel.system();
      const status = NotificationStatus.sent();
      const createdAt = new Date();
      const sentAt = new Date();
      
      const notification = Notification.fromPersistence({
        id,
        recipientId,
        content,
        channel,
        status,
        createdAt,
        sentAt,
      });
      
      expect(notification.id.equals(id)).toBe(true);
      expect(notification.recipientId.equals(recipientId)).toBe(true);
      expect(notification.content.equals(content)).toBe(true);
      expect(notification.channel.equals(channel)).toBe(true);
      expect(notification.status.equals(status)).toBe(true);
      expect(notification.createdAt).toBe(createdAt);
      expect(notification.sentAt).toBe(sentAt);
    });
  });

  describe('equals', () => {
    it('should return true for notifications with same ID', () => {
      const notification1 = createTestNotification();
      const notification2 = Notification.fromPersistence({
        id: notification1.id,
        recipientId: notification1.recipientId,
        content: notification1.content,
        channel: notification1.channel,
        status: notification1.status,
        createdAt: notification1.createdAt,
      });
      
      expect(notification1.equals(notification2)).toBe(true);
    });

    it('should return false for notifications with different IDs', () => {
      const notification1 = createTestNotification();
      const notification2 = createTestNotification();
      
      expect(notification1.equals(notification2)).toBe(false);
    });
  });
});