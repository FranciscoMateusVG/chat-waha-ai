import { NotificationChannel, NotificationChannelType } from '../notification-channel.vo';

describe('NotificationChannel', () => {
  describe('constructor', () => {
    it('should create a valid notification channel with enum value', () => {
      const channel = new NotificationChannel(NotificationChannelType.WHATSAPP);
      expect(channel.value).toBe(NotificationChannelType.WHATSAPP);
    });

    it('should create a valid notification channel with string value', () => {
      const channel = new NotificationChannel('whatsapp');
      expect(channel.value).toBe(NotificationChannelType.WHATSAPP);
    });

    it('should throw error for invalid channel string', () => {
      expect(() => new NotificationChannel('invalid')).toThrow('Invalid notification channel: invalid');
    });
  });

  describe('supportsBatchDelivery', () => {
    it('should return true for whatsapp channel', () => {
      const channel = NotificationChannel.whatsapp();
      expect(channel.supportsBatchDelivery()).toBe(true);
    });

    it('should return true for system channel', () => {
      const channel = NotificationChannel.system();
      expect(channel.supportsBatchDelivery()).toBe(true);
    });
  });

  describe('requiresRateLimiting', () => {
    it('should return true for whatsapp channel', () => {
      const channel = NotificationChannel.whatsapp();
      expect(channel.requiresRateLimiting()).toBe(true);
    });

    it('should return false for system channel', () => {
      const channel = NotificationChannel.system();
      expect(channel.requiresRateLimiting()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same channel values', () => {
      const channel1 = NotificationChannel.whatsapp();
      const channel2 = NotificationChannel.whatsapp();
      expect(channel1.equals(channel2)).toBe(true);
    });

    it('should return false for different channel values', () => {
      const channel1 = NotificationChannel.system();
      const channel2 = NotificationChannel.whatsapp();
      expect(channel1.equals(channel2)).toBe(false);
    });
  });

  describe('static factory methods', () => {
    it('should create system channel', () => {
      const channel = NotificationChannel.system();
      expect(channel.value).toBe(NotificationChannelType.SYSTEM);
    });

    it('should create whatsapp channel', () => {
      const channel = NotificationChannel.whatsapp();
      expect(channel.value).toBe(NotificationChannelType.WHATSAPP);
    });
  });

  describe('toString', () => {
    it('should return string representation of channel', () => {
      const channel = NotificationChannel.whatsapp();
      expect(channel.toString()).toBe('whatsapp');
    });
  });
});
