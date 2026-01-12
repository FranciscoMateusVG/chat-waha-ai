export enum NotificationChannelType {
  SYSTEM = 'system',
  WHATSAPP = 'whatsapp',
}

export class NotificationChannel {
  private readonly _value: NotificationChannelType;

  constructor(value: NotificationChannelType | string) {
    if (typeof value === 'string') {
      if (!Object.values(NotificationChannelType).includes(value as NotificationChannelType)) {
        throw new Error(`Invalid notification channel: ${value}`);
      }
      this._value = value as NotificationChannelType;
    } else {
      this._value = value;
    }
  }

  get value(): NotificationChannelType {
    return this._value;
  }

  supportsBatchDelivery(): boolean {
    switch (this._value) {
      case NotificationChannelType.WHATSAPP:
        return true;
      case NotificationChannelType.SYSTEM:
        return true;
      default:
        return false;
    }
  }

  requiresRateLimiting(): boolean {
    switch (this._value) {
      case NotificationChannelType.WHATSAPP:
        return true;
      case NotificationChannelType.SYSTEM:
        return false;
      default:
        return false;
    }
  }

  equals(other: NotificationChannel): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static system(): NotificationChannel {
    return new NotificationChannel(NotificationChannelType.SYSTEM);
  }

  static whatsapp(): NotificationChannel {
    return new NotificationChannel(NotificationChannelType.WHATSAPP);
  }
}