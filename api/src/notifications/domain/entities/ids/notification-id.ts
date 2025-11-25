import { v4 as uuid } from 'uuid';

export class NotificationId {
  private readonly _value: string;

  constructor(value?: string) {
    if (value) {
      if (!this.isValidId(value)) {
        throw new Error(`Invalid notification ID format: ${value}`);
      }
      this._value = value;
    } else {
      this._value = uuid();
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: NotificationId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  private isValidId(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  static fromString(value: string): NotificationId {
    return new NotificationId(value);
  }

  static generate(): NotificationId {
    return new NotificationId();
  }
}